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
import {validateCheckSum} from './lib/checksum';
import {getConfigHome} from './lib/install';

const plugin_name = core.getInput('plugin_name');

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

        // sign core process
        if (process.env.NOTATION_EXPERIMENTAL) {
            if (plugin_config) {
                await exec.getExecOutput('notation', ['sign', '--allow-referrers-api', '--signature-format', signature_format, '--id', key_id, '--plugin', plugin_name, ...pluginConfigList, target_artifact_ref]);
            } else {
                await exec.getExecOutput('notation', ['sign', '--allow-referrers-api', '--signature-format', signature_format, '--id', key_id, '--plugin', plugin_name, target_artifact_ref]);
            }
        } else {
            if (plugin_config) {
                await exec.getExecOutput('notation', ['sign', '--signature-format', signature_format, '--id', key_id, '--plugin', plugin_name, ...pluginConfigList, target_artifact_ref]);
            } else {
                await exec.getExecOutput('notation', ['sign', '--signature-format', signature_format, '--id', key_id, '--plugin', plugin_name, target_artifact_ref]);
            }
        }
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
        // inputs from user
        const plugin_url = core.getInput('plugin_url');
        const plugin_checksum = core.getInput('plugin_checksum').toLowerCase();
        console.log(`signing plugin url is ${plugin_url}`);

        // download signing plugin and validate checksum
        const pathToTarball = await tc.downloadTool(plugin_url);
        await validateCheckSum(pathToTarball, plugin_checksum);
        
        // extract and install the plugin
        const extract = plugin_url.endsWith('.zip') ? tc.extractZip : tc.extractTar;
        const pluginPath = path.join(getConfigHome(), `notation/plugins/${plugin_name}`);
        fs.mkdirSync(pluginPath, { recursive: true, });
        await extract(pathToTarball, pluginPath);
        console.log(`Successfully moved the plugin binary to ${pluginPath}`);
        fs.chmod(pluginPath, 0o755, (err) => {
            if (err) throw err;
            console.log(`Successfully changed permission of plugin binary`);
        });
    } catch (e: unknown) {
        if (e instanceof Error) {
            core.setFailed(e);
        } else {
            core.setFailed('Unknown error during setting up notation signing plugin');
        }
    }
}

function getPluginConfigList(pluginConfig: string): string[] {
    if (!pluginConfig) {
        return [];
    }
    let pluginConfigList: string[] = JSON.parse(pluginConfig);
    if (!Array.isArray(pluginConfigList)) {
        throw new Error("plugin_config is not a JSON array");
    }
    for (let i = 0; i < pluginConfigList.length; ++i) {
        pluginConfigList[i] = "--plugin-config=" + pluginConfigList[i];
    }
    return pluginConfigList;
}

export = sign;

if (require.main === module) {
    sign();
}