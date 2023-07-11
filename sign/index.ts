import * as os from 'os';
import * as core from '@actions/core';
import { execSync } from 'child_process';
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
        let output = execSync(`notation plugin ls`, { encoding: 'utf-8' });
        console.log('notation plugin list output:\n', output);
        const key_id = core.getInput('key_id');
        const plugin_config = core.getInput('plugin_config').toLowerCase();
        const target_artifact_ref = core.getInput('target_artifact_reference');
        let signOutput;
        if (process.env.NOTATION_EXPERIMENTAL) {
            if (plugin_config) {
                signOutput = execSync(`notation sign --signature-format cose --allow-referrers-api --id ${key_id} --plugin ${plugin_name} --plugin-config=${plugin_config} ${target_artifact_ref}`, { encoding: 'utf-8' });
            } else {
                signOutput = execSync(`notation sign --signature-format cose --allow-referrers-api --id ${key_id} --plugin ${plugin_name} ${target_artifact_ref}`, { encoding: 'utf-8' });
            }
            console.log('notation sign output:\n', signOutput);
        } else {
            if (plugin_config) {
                signOutput = execSync(`notation sign --signature-format cose --id ${key_id} --plugin ${plugin_name} --plugin-config=${plugin_config} ${target_artifact_ref}`, { encoding: 'utf-8' });
            } else {
                signOutput = execSync(`notation sign --signature-format cose --id ${key_id} --plugin ${plugin_name} ${target_artifact_ref}`, { encoding: 'utf-8' });
            }
            console.log('notation sign output:\n', signOutput);
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
        const plugin_checksum = core.getInput('plugin_checksum');
        console.log(`signing plugin url is ${plugin_url}`);
        const pluginPath = os.homedir() + `/.config/notation/plugins/${plugin_name}`;
        fs.mkdirSync(pluginPath, { recursive: true, });

        const pathToTarball = await tc.downloadTool(plugin_url);
        const buff = fs.readFileSync(pathToTarball);
        const sha256 = hash(buff);
        if (sha256 !== plugin_checksum) {
            throw new Error(`checksum of downloaded plugin ${sha256} does not match user input ${plugin_checksum}`);
        }
        const extract = plugin_url.endsWith('.zip') ? tc.extractZip : tc.extractTar;
        const pathToPluginDownload = await extract(pathToTarball);

        const currentPath = path.join(pathToPluginDownload, "/", `notation-${plugin_name}`);
        const destinationPath = path.join(pluginPath, "/", `notation-${plugin_name}`);

        mv.default(currentPath, destinationPath, function (err: Error) {
            if (err) throw err;
            console.log(`Successfully moved the plugin file to ${destinationPath}`);
            fs.chmod(destinationPath, 0o755, (err) => {
                if (err) throw err;
                console.log(`Successfully changed permission for file "${destinationPath}"`);
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

export = sign;

if (require.main === module) {
    sign();
}