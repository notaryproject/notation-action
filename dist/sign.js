"use strict";
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
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
const core = __importStar(require("@actions/core"));
const exec = __importStar(require("@actions/exec"));
const tc = __importStar(require("@actions/tool-cache"));
const path = __importStar(require("path"));
const fs = __importStar(require("fs"));
const semver = __importStar(require("semver"));
const checksum_1 = require("./lib/checksum");
const install_1 = require("./lib/install");
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
const notationPluginBinary = `notation-${plugin_name}` + (0, install_1.getBinaryExtension)();
// sign signs the target artifact with Notation.
function sign() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            // inputs from user
            const key_id = core.getInput('key_id');
            const plugin_config = core.getInput('plugin_config');
            const target_artifact_ref = core.getInput('target_artifact_reference');
            const signature_format = core.getInput('signature_format');
            const allow_referrers_api = core.getInput('allow_referrers_api');
            const timestamp_url = core.getInput('timestamp_url');
            const timestamp_root_cert = core.getInput('timestamp_root_cert');
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
            // get list of target artifact references
            const targetArtifactReferenceList = [];
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
            yield setupPlugin();
            yield exec.getExecOutput('notation', ['plugin', 'ls']);
            // sign core process
            const pluginConfigList = getPluginConfigList(plugin_config);
            let notationCommand = ['sign', '--signature-format', signature_format, '--id', key_id, '--plugin', plugin_name, ...pluginConfigList];
            if (allow_referrers_api.toLowerCase() === 'true') {
                // if process.env.NOTATION_EXPERIMENTAL is not set, notation would
                // fail the command as expected.
                notationCommand.push('--allow-referrers-api');
            }
            if (timestamp_url) {
                // sign with timestamping
                console.log(`timestamping url is ${timestamp_url}`);
                console.log(`timestamping root cert is ${timestamp_root_cert}`);
                const timestampingArr = ['--timestamp-url', timestamp_url, '--timestamp-root-cert', timestamp_root_cert];
                notationCommand.push(...timestampingArr);
            }
            for (const ref of targetArtifactReferenceList) {
                yield exec.getExecOutput('notation', [...notationCommand, ref]);
            }
        }
        catch (e) {
            if (e instanceof Error) {
                core.setFailed(e);
            }
            else {
                core.setFailed('unknown error during notation sign');
            }
        }
    });
}
// setupPlugin sets up the Notation signing plugin.
function setupPlugin() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            console.log(`input plugin_name is ${plugin_name}`);
            console.log(`input plugin url is ${plugin_url}`);
            console.log(`input plugin checksum is ${plugin_checksum}`);
            // check if plugin is already installed
            const notationPluginPath = path.join((0, install_1.getConfigHome)(), `notation/plugins/${plugin_name}`);
            if (checkPluginExistence(notationPluginPath)) {
                console.log(`plugin ${plugin_name} is already installed`);
                return;
            }
            // downoad signign plugin via Notation
            const { stdout: stdout } = yield exec.getExecOutput('notation', ['version']);
            let versionOutput = stdout.split("\n");
            let notationVersion = semver.clean(versionOutput[2].split(":")[1].trim());
            if (semver.gte(String(notationVersion), '1.1.0')) {
                console.log("installing signing plugin via Notation...");
                yield exec.getExecOutput('notation', ['plugin', 'install', '--url', plugin_url, '--sha256sum', plugin_checksum]);
                return;
            }
            // download signing plugin, validate checksum and plugin name
            console.log("downloading signing plugin...");
            const pathToTarball = yield tc.downloadTool(plugin_url);
            console.log("downloading signing plugin completed");
            const sha256 = yield (0, checksum_1.hash)(pathToTarball);
            if (sha256 !== plugin_checksum) {
                throw new Error(`checksum of downloaded plugin ${sha256} does not match expected checksum ${plugin_checksum}`);
            }
            console.log("successfully verified download checksum");
            yield validateDownloadPluginName(pathToTarball);
            console.log("successfully validated downloaded plugin name");
            // install the plugin
            const extract = plugin_url.endsWith('.zip') ? tc.extractZip : tc.extractTar;
            fs.mkdirSync(notationPluginPath, { recursive: true, });
            yield extract(pathToTarball, notationPluginPath);
            console.log(`successfully extracted the plugin binary to ${notationPluginPath}`);
            fs.chmod(path.join(notationPluginPath, notationPluginBinary), 0o755, (err) => {
                if (err)
                    throw err;
                console.log(`successfully changed permission of plugin binary`);
            });
        }
        catch (e) {
            if (e instanceof Error) {
                throw e;
            }
            else {
                throw new Error("unknown error during setting up notation signing plugin");
            }
        }
    });
}
// checkPluginExistence checks if the plugin is already installed in Notation
function checkPluginExistence(notationPluginPath) {
    const pluginBinaryPath = path.join(notationPluginPath, notationPluginBinary);
    return fs.existsSync(pluginBinaryPath);
}
// validateDownloadPluginName validates the downloaded plugin binary name
// matches with user input plugin name
function validateDownloadPluginName(pathToTarball) {
    return __awaiter(this, void 0, void 0, function* () {
        const extract = plugin_url.endsWith('.zip') ? tc.extractZip : tc.extractTar;
        const curDir = yield extract(pathToTarball);
        const expectedPluginBinaryPath = path.join(curDir, notationPluginBinary);
        if (!fs.existsSync(expectedPluginBinaryPath)) {
            throw new Error(`downloaded plugin does not match user input plugin_name, expected "${notationPluginBinary}" not found`);
        }
    });
}
// getPluginConfigList assembles --plugin-config for notaiton sign command
function getPluginConfigList(pluginConfig) {
    if (!pluginConfig) {
        return [];
    }
    let pluginConfigList = [];
    for (let config of pluginConfig.split(/\r?\n/)) {
        config = config.trim();
        if (config) {
            pluginConfigList.push("--plugin-config=" + config);
        }
    }
    return pluginConfigList;
}
if (require.main === module) {
    sign();
}
module.exports = sign;
//# sourceMappingURL=sign.js.map