/*
 * Copyright The Notary Project Authors.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import * as core from '@actions/core';
import * as exec from '@actions/exec';
import * as tc from '@actions/tool-cache';
import * as path from 'path';
import * as fs from 'fs';
import {hash} from './lib/checksum';
import {getConfigHome, getBinaryExtension} from './lib/install';

// plugin inputs from user
const plugin_name = core.getInput('plugin_name');
if (!plugin_name) {
    throw new Error("input plugin_name is required");
}
const plugin_url = core.getInput('plugin_url');
if (!plugin_url) {
    throw new Error("input plugin_url is required");
}
const plugin_checksum = core.getInput('plugin_checksum').toLowerCase();
if (!plugin_checksum) {
    throw new Error("input plugin_checksum is required");
}
const notationPluginBinary = `notation-${plugin_name}` + getBinaryExtension();

// sign signs the target artifact with Notation.
async function sign(): Promise<void> {
    try {
        // inputs from user
        const key_id = core.getInput('key_id');
        const plugin_config = core.getInput('plugin_config');
        const target_artifact_ref = core.getInput('target_artifact_reference');
        const signature_format = core.getInput('signature_format');
        const allow_referrers_api = core.getInput('allow_referrers_api');

        // sanity check
        if (!key_id) {
            throw new Error("input key_id is required");
        }
        if (!target_artifact_ref) {
            throw new Error("input target_artifact_reference is required");
        }

        // setting up notation signing plugin
        await setupPlugin();
        await exec.getExecOutput('notation', ['plugin', 'ls']);

        // sign core process
        const pluginConfigList = getPluginConfigList(plugin_config);
        let notationCommand: string[] = ['sign', '--signature-format', signature_format, '--id', key_id, '--plugin', plugin_name, ...pluginConfigList];
        if (allow_referrers_api.toLowerCase() === 'true') {
            // if process.env.NOTATION_EXPERIMENTAL is not set, notation would
            // fail the command as expected.
            notationCommand.push('--allow-referrers-api');
        }
        await exec.getExecOutput('notation', [...notationCommand, target_artifact_ref]);
    } catch (e: unknown) {
        if (e instanceof Error) {
            core.setFailed(e);
        } else {
            core.setFailed('unknown error during notation sign');
        }
    }
}

// setupPlugin sets up the Notation signing plugin.
async function setupPlugin() {
    try {
        console.log(`input plugin_name is ${plugin_name}`);
        console.log(`input plugin url is ${plugin_url}`);
        console.log(`input plugin checksum is ${plugin_checksum}`);

        // check if plugin is already installed
        const notationPluginPath = path.join(getConfigHome(), `notation/plugins/${plugin_name}`);
        if (checkPluginExistence(notationPluginPath)) {
            console.log(`plugin ${plugin_name} is already installed`);
            return
        }

        // download signing plugin, validate checksum and plugin name
        console.log("downloading signing plugin...")
        const pathToTarball = await tc.downloadTool(plugin_url);
        console.log("downloading signing plugin completed")
        const sha256 = await hash(pathToTarball);
        if (sha256 !== plugin_checksum) {
            throw new Error(`checksum of downloaded plugin ${sha256} does not match expected checksum ${plugin_checksum}`);
        }
        console.log("successfully verified download checksum")
        await validateDownloadPluginName(pathToTarball);
        console.log("successfully validated downloaded plugin name")

        // install the plugin
        const extract = plugin_url.endsWith('.zip') ? tc.extractZip : tc.extractTar;
        fs.mkdirSync(notationPluginPath, { recursive: true, });
        await extract(pathToTarball, notationPluginPath);
        console.log(`successfully extracted the plugin binary to ${notationPluginPath}`);
        fs.chmod(path.join(notationPluginPath, notationPluginBinary), 0o755, (err) => {
            if (err) throw err;
            console.log(`successfully changed permission of plugin binary`);
        });
    } catch (e: unknown) {
        if (e instanceof Error) {
            throw e;
        } else {
            throw new Error("unknown error during setting up notation signing plugin");
        }
    }
}

// checkPluginExistence checks if the plugin is already installed in Notation
function checkPluginExistence(notationPluginPath: string): boolean {
    const pluginBinaryPath = path.join(notationPluginPath, notationPluginBinary);
    return fs.existsSync(pluginBinaryPath);
}

// validateDownloadPluginName validates the downloaded plugin binary name
// matches with user input plugin name
async function validateDownloadPluginName(pathToTarball: string) {
    const extract = plugin_url.endsWith('.zip') ? tc.extractZip : tc.extractTar;
    const curDir = await extract(pathToTarball);
    const expectedPluginBinaryPath = path.join(curDir, notationPluginBinary);
    if (!fs.existsSync(expectedPluginBinaryPath)) {
        throw new Error(`downloaded plugin does not match user input plugin_name, expected "${notationPluginBinary}" not found`);
    }
}

// getPluginConfigList assembles --plugin-config for notaiton sign command
function getPluginConfigList(pluginConfig: string): string[] {
    if (!pluginConfig) {
        return [];
    }
    let pluginConfigList: string[] = [];
    for (let config of pluginConfig.split(/\r|\n/)) {
        config = config.trim();
        if (config) {
            pluginConfigList.push("--plugin-config=" + config); 
        }
    }
    return pluginConfigList;
}

export = sign;

if (require.main === module) {
    sign();
}