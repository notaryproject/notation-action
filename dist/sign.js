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
const checksum_1 = require("./lib/checksum");
const install_1 = require("./lib/install");
const plugin_name = core.getInput('plugin_name');
// sign signs the target artifact with Notation.
function sign() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            yield setupPlugin();
            yield exec.getExecOutput('notation', ['plugin', 'ls']);
            // inputs from user
            const key_id = core.getInput('key_id');
            const plugin_config = core.getInput('plugin_config');
            const pluginConfigList = getPluginConfigList(plugin_config);
            const target_artifact_ref = core.getInput('target_artifact_reference');
            const signature_format = core.getInput('signature_format');
            // sign core process
            if (process.env.NOTATION_EXPERIMENTAL) {
                yield exec.getExecOutput('notation', ['sign', '--allow-referrers-api', '--signature-format', signature_format, '--id', key_id, '--plugin', plugin_name, ...pluginConfigList, target_artifact_ref]);
            }
            else {
                yield exec.getExecOutput('notation', ['sign', '--signature-format', signature_format, '--id', key_id, '--plugin', plugin_name, ...pluginConfigList, target_artifact_ref]);
            }
        }
        catch (e) {
            if (e instanceof Error) {
                core.setFailed(e);
            }
            else {
                core.setFailed('Unknown error during notation sign');
            }
        }
    });
}
// setupPlugin sets up the Notation signing plugin.
function setupPlugin() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            // inputs from user
            const plugin_url = core.getInput('plugin_url');
            const plugin_checksum = core.getInput('plugin_checksum').toLowerCase();
            console.log(`signing plugin url is ${plugin_url}`);
            // download signing plugin and validate checksum
            const pathToTarball = yield tc.downloadTool(plugin_url);
            yield (0, checksum_1.validateCheckSum)(pathToTarball, plugin_checksum);
            // extract and install the plugin
            const extract = plugin_url.endsWith('.zip') ? tc.extractZip : tc.extractTar;
            const pluginPath = path.join((0, install_1.getConfigHome)(), `notation/plugins/${plugin_name}`);
            fs.mkdirSync(pluginPath, { recursive: true, });
            yield extract(pathToTarball, pluginPath);
            console.log(`Successfully moved the plugin binary to ${pluginPath}`);
            fs.chmod(pluginPath, 0o755, (err) => {
                if (err)
                    throw err;
                console.log(`Successfully changed permission of plugin binary`);
            });
        }
        catch (e) {
            if (e instanceof Error) {
                core.setFailed(e);
            }
            else {
                core.setFailed('Unknown error during setting up notation signing plugin');
            }
        }
    });
}
function getPluginConfigList(pluginConfig) {
    if (!pluginConfig) {
        return [];
    }
    let pluginConfigList = JSON.parse(pluginConfig);
    if (!Array.isArray(pluginConfigList)) {
        throw new Error("plugin_config is not a JSON array");
    }
    for (let i = 0; i < pluginConfigList.length; ++i) {
        pluginConfigList[i] = "--plugin-config=" + pluginConfigList[i];
    }
    return pluginConfigList;
}
if (require.main === module) {
    sign();
}
module.exports = sign;
//# sourceMappingURL=sign.js.map