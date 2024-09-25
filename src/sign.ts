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
import * as semver from 'semver';
import {hash} from './lib/checksum';
import {getConfigHome, getBinaryExtension} from './lib/install';
import { notationCLIVersion } from './setup';

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
        // notation CLI version
        const notationVersion = await notationCLIVersion();
        console.log("Notation CLI version is ", notationVersion);

        // inputs from user
        const key_id = core.getInput('key_id');
        const plugin_config = core.getInput('plugin_config');
        const target_artifact_ref = core.getInput('target_artifact_reference');
        const signature_format = core.getInput('signature_format');
        const allow_referrers_api = core.getInput('allow_referrers_api');
        const timestamp_url = core.getInput('timestamp_url');
        const timestamp_root_cert = core.getInput('timestamp_root_cert');
        const force_referrers_tag = core.getInput('force_referrers_tag');

        // sanity check
        if (!key_id) {
            throw new Error("input key_id is required");
        }
        if (!target_artifact_ref) {
            throw new Error("input target_artifact_reference is required");
        }
        if (timestamp_url && !timestamp_root_cert) {
            throw new Error("timestamp_url is set, missing input timestamp_root_cert");
        }
        if (timestamp_root_cert && !timestamp_url) {
            throw new Error("timestamp_root_cert is set, missing input timestamp_url");
        }
        if (force_referrers_tag && semver.lt(notationVersion, '1.2.0')) {
            throw new Error("force_referrers_tag is only valid for Notation v1.2.0 or later");
        }
        if (force_referrers_tag && force_referrers_tag.toLowerCase() !== 'true' && force_referrers_tag.toLowerCase() !== 'false') {
            throw new Error(`force_referrers_tag must be set to 'true' or 'false'. Got '${force_referrers_tag}'`);
        }

        // get list of target artifact references
        const targetArtifactReferenceList: string[] = [];
        for (let ref of target_artifact_ref.split(/\r?\n/)) {
            ref = ref.trim();
            if (ref) {
                targetArtifactReferenceList.push(ref); 
            }
        }
        if (targetArtifactReferenceList.length === 0) {
            throw new Error("input target_artifact_reference does not contain any valid reference");
        }

        // setting up notation signing plugin
        await setupPlugin(notationVersion);
        await exec.getExecOutput('notation', ['plugin', 'ls']);

        // sign core process
        const pluginConfigList = getPluginConfigList(plugin_config);
        let notationCommand: string[] = ['sign', '--signature-format', signature_format, '--id', key_id, '--plugin', plugin_name, ...pluginConfigList];
        if (force_referrers_tag.toLowerCase() === 'true') {
            console.log("'force_referrers_tag' set to true, use referrers tag schema only");
            // use referrers tag schema only
            notationCommand.push('--force-referrers-tag=true');
        } else if (force_referrers_tag.toLowerCase() === 'false') {
            console.log("'force_referrers_tag' set to false, try referrers api first");
            // try referrers api first
            notationCommand.push('--force-referrers-tag=false');
        } else if (allow_referrers_api.toLowerCase() === 'true') {
            // if process.env.NOTATION_EXPERIMENTAL is not set, notation would
            // fail the command as expected.
            if (semver.lt(notationVersion, '1.2.0')) {
                console.log("'allow_referrers_api' set to true, try referrers api first");
                notationCommand.push('--allow-referrers-api');
            } else {
                // Deprecated for Notation v1.2.0 or later.
                console.log("'allow_referrers_api' is deprecated. Use 'force_referrers_tag' instead, try referrers api first");
                notationCommand.push('--force-referrers-tag=false');
            }
        }
        if (timestamp_url) {
            // sign with timestamping
            console.log(`timestamping url is ${timestamp_url}`);
            console.log(`timestamping root cert is ${timestamp_root_cert}`);
            const timestampingArr: string[] = ['--timestamp-url', timestamp_url, '--timestamp-root-cert', timestamp_root_cert];
            notationCommand.push(...timestampingArr);
        }
        for (const ref of targetArtifactReferenceList) {
            await exec.getExecOutput('notation', [...notationCommand, ref]);
        }
    } catch (e: unknown) {
        if (e instanceof Error) {
            core.setFailed(e);
        } else {
            core.setFailed('unknown error during notation sign');
        }
    }
}

// setupPlugin sets up the Notation signing plugin.
async function setupPlugin(notationVersion: string) {
    try {
        console.log(`input plugin_name is ${plugin_name}`);
        console.log(`input plugin url is ${plugin_url}`);
        console.log(`input plugin checksum is ${plugin_checksum}`);

        // check if plugin is already installed
        const notationPluginPath = path.join(getConfigHome(), `notation/plugins/${plugin_name}`);
        if (checkPluginExistence(notationPluginPath)) {
            console.log(`plugin ${plugin_name} is already installed`);
            return;
        }

        // downoad signing plugin via Notation
        if (semver.gte(notationVersion, '1.1.0')) {
            console.log("installing signing plugin via Notation...");
            await exec.getExecOutput('notation', ['plugin', 'install', '--url', plugin_url, '--sha256sum', plugin_checksum]);
            return;
        }

        // download signing plugin, validate checksum and plugin name
        console.log("downloading signing plugin...");
        const pathToTarball = await tc.downloadTool(plugin_url);
        console.log("downloading signing plugin completed");
        const sha256 = await hash(pathToTarball);
        if (sha256 !== plugin_checksum) {
            throw new Error(`checksum of downloaded plugin ${sha256} does not match expected checksum ${plugin_checksum}`);
        }
        console.log("successfully verified download checksum");
        await validateDownloadPluginName(pathToTarball);
        console.log("successfully validated downloaded plugin name");

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
    for (let config of pluginConfig.split(/\r?\n/)) {
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