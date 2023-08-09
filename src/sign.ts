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
import {getConfigHome} from './lib/install';

// plugin inputs from user
const plugin_name = core.getInput('plugin_name');
const plugin_url = core.getInput('plugin_url');
const plugin_checksum = core.getInput('plugin_checksum').toLowerCase();

// sign signs the target artifact with Notation.
async function sign(): Promise<void> {
    try {
        await setupPlugin();
        await exec.getExecOutput('notation', ['plugin', 'ls']);
        
        // inputs from user
        const key_id = core.getInput('key_id');
        const plugin_config = core.getInput('plugin_config');
        const pluginConfigList = getPluginConfigList(plugin_config);
        const target_artifact_ref = core.getInput('target_artifact_reference');
        const signature_format = core.getInput('signature_format');
        const allow_referrers_api = core.getInput('allow_referrers_api');

        // sign core process
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
            core.setFailed('Unknown error during notation sign');
        }
    }
}

// setupPlugin sets up the Notation signing plugin.
async function setupPlugin() {
    try {
        console.log(`signing plugin url is ${plugin_url}`);
        const notationPluginPath = path.join(getConfigHome(), `notation/plugins/${plugin_name}`);
        if (checkPluginExistence(notationPluginPath)) {
            console.log("user specified plugin already installed");
            return
        }

        // download signing plugin and validate checksum
        const pathToTarball = await tc.downloadTool(plugin_url);
        const sha256 = await hash(pathToTarball);
        if (sha256 !== plugin_checksum) {
            throw new Error(`checksum of downloaded plugin ${sha256} does not match ground truth ${plugin_checksum}`);
        }
        console.log("Successfully checked download checksum against ground truth")
        await validateDownloadPluginName(pathToTarball);

        // extract and install the plugin
        const extract = plugin_url.endsWith('.zip') ? tc.extractZip : tc.extractTar;
        fs.mkdirSync(notationPluginPath, { recursive: true, });
        await extract(pathToTarball, notationPluginPath);
        console.log(`Successfully moved the plugin binary to ${notationPluginPath}`);
        // fs.chmod(notationPluginPath, 0o755, (err) => {
        //     if (err) throw err;
        //     console.log(`Successfully changed permission of plugin binary`);
        // });
    } catch (e: unknown) {
        if (e instanceof Error) {
            throw e;
        } else {
            throw new Error("Unknown error during setting up notation signing plugin");
        }
    }
}

function checkPluginExistence(notationPluginPath: string): boolean {
    const pluginBinaryPath = path.join(notationPluginPath, `notation-${plugin_name}`);
    return fs.existsSync(pluginBinaryPath);
}

async function validateDownloadPluginName(pathToTarball: string) {
    const extract = plugin_url.endsWith('.zip') ? tc.extractZip : tc.extractTar;
    const curDir = await extract(pathToTarball);
    const expectedPluginBinaryPath = path.join(curDir, `notation-${plugin_name}`);
    if (!fs.existsSync(expectedPluginBinaryPath)) {
        throw new Error(`Downloaded plugin does not match user input plugin_name, expected notation-${plugin_name} not found`);
    }
}

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