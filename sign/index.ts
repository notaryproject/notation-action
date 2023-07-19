import * as os from 'os';
import * as core from '@actions/core';
import * as exec from '@actions/exec';
import * as tc from '@actions/tool-cache';
import * as path from 'path';
import * as fs from 'fs';
import * as mv from 'mv';
import * as crypto from 'crypto';

const plugin_name = core.getInput('plugin_name');

// sign the target artifact with Notation.
async function sign() {
    try {
        await setupPlugin();
        await exec.getExecOutput('notation', ['plugin', 'ls']);
        const key_id = core.getInput('key_id');
        const plugin_config = core.getInput('plugin_config');
        const target_artifact_ref = core.getInput('target_artifact_reference');
        const signature_format = core.getInput('signature_format');
        if (process.env.NOTATION_EXPERIMENTAL) {
            if (plugin_config) {
                await exec.getExecOutput('notation', ['sign', '--allow-referrers-api', '--signature-format', signature_format, '--id', key_id, '--plugin', plugin_name, `--plugin-config=${plugin_config}`, target_artifact_ref]);
            } else {
                await exec.getExecOutput('notation', ['sign', '--allow-referrers-api', '--signature-format', signature_format, '--id', key_id, '--plugin', plugin_name, target_artifact_ref]);
            }
        } else {
            if (plugin_config) {
                await exec.getExecOutput('notation', ['sign', '--signature-format', signature_format, '--id', key_id, '--plugin', plugin_name, `--plugin-config=${plugin_config}`, target_artifact_ref]);
            } else {
                await exec.getExecOutput('notation', ['sign', '--signature-format', signature_format, '--id', key_id, '--plugin', plugin_name, target_artifact_ref]);
            }
        }
    } catch (e: unknown) {
        if (e instanceof Error) {
            core.setFailed(e);
        } else {
            core.setFailed('Unknown error');
        }
    }
}

// setup the signing Sign.
async function setupPlugin() {
    try {
        const plugin_url = core.getInput('plugin_url');
        const plugin_checksum = core.getInput('plugin_checksum').toLowerCase();
        console.log(`signing plugin url is ${plugin_url}`);
        const pluginPath = path.join(getConfigHome(), `notation/plugins/${plugin_name}`);
        fs.mkdirSync(pluginPath, { recursive: true, });

        const pathToTarball = await tc.downloadTool(plugin_url);
        const buff = fs.readFileSync(pathToTarball);
        const sha256 = hash(buff);
        if (sha256 !== plugin_checksum) {
            throw new Error(`checksum of downloaded plugin ${sha256} does not match user input ${plugin_checksum}`);
        }
        console.log("Successfully checked download checksum against user input")
        const extract = plugin_url.endsWith('.zip') ? tc.extractZip : tc.extractTar;
        const pathToPluginDownload = await extract(pathToTarball);

        const currentPath = path.join(pathToPluginDownload, "/", `notation-${plugin_name}`);
        const destinationPath = path.join(pluginPath, "/", `notation-${plugin_name}`);

        mv.default(currentPath, destinationPath, function (err: Error) {
            if (err) throw err;
            console.log(`Successfully moved the plugin file to ${destinationPath}`);
            fs.chmod(destinationPath, 0o755, (err) => {
                if (err) throw err;
                console.log(`Successfully changed permission for plugin file`);
            });
        });
    } catch (e: unknown) {
        if (e instanceof Error) {
            core.setFailed(e);
        } else {
            core.setFailed('Unknown error');
        }
    }
}

// hash computes SH256 of src file.
function hash(src: Buffer) {
    return crypto.createHash('sha256').update(src).digest('hex').toLowerCase();
}

// getConfigHome gets Notation config home dir based on platform
// reference: https://notaryproject.dev/docs/concepts/directory-structure/#user-level
function getConfigHome(): string { 
    const platform = os.platform(); 
    switch (platform) {
        case 'win32': 
            if (!process.env.APPDATA) { 
                throw new Error('APPDATA is undefined'); 
            } 
            return process.env.APPDATA; 
        case 'darwin': 
            return path.join(os.homedir(), 'Library', 'Application Support'); 
        case 'linux': 
            return process.env.XDG_CONFIG_HOME ? process.env.XDG_CONFIG_HOME : path.join(os.homedir(), '.config');
        default: 
            throw new Error(`Unknown platform: ${platform}`);
    }
}

export = sign;

if (require.main === module) {
    sign();
}