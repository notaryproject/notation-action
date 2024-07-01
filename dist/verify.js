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
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const install_1 = require("./lib/install");
const X509 = "x509";
// verify verifies the target artifact with Notation
function verify() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            // inputs from user
            const target_artifact_ref = core.getInput('target_artifact_reference');
            const trust_policy = core.getInput('trust_policy'); // .github/trustpolicy/trustpolicy.json
            const trust_store = core.getInput('trust_store'); // .github/truststore
            const allow_referrers_api = core.getInput('allow_referrers_api');
            // sanity check
            if (!target_artifact_ref) {
                throw new Error("input target_artifact_reference is required");
            }
            if (!trust_policy) {
                throw new Error("input trust_policy is required");
            }
            if (!trust_store) {
                throw new Error("input trust_store is required");
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
            // configure Notation trust policy
            yield exec.getExecOutput('notation', ['policy', 'import', '--force', trust_policy]);
            yield exec.getExecOutput('notation', ['policy', 'show']);
            // configure Notation trust store
            yield configTrustStore(trust_store);
            yield exec.getExecOutput('notation', ['cert', 'ls']);
            // verify core process
            let notationCommand = ['verify', '-v'];
            if (allow_referrers_api.toLowerCase() === 'true') {
                // if process.env.NOTATION_EXPERIMENTAL is not set, notation would
                // fail the command as expected.
                notationCommand.push('--allow-referrers-api');
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
                core.setFailed('unknown error during notation verify');
            }
        }
    });
}
// configTrustStore configures Notation trust store based on specs.
// Reference: https://github.com/notaryproject/specifications/blob/v1.0.0-rc.2/specs/trust-store-trust-policy.md#trust-store
function configTrustStore(dir) {
    return __awaiter(this, void 0, void 0, function* () {
        let trustStoreX509 = path.join(dir, X509); // .github/truststore/x509
        if (!fs.existsSync(trustStoreX509)) {
            throw new Error(`cannot find trust store dir: ${trustStoreX509}`);
        }
        const trustStorePath = path.join((0, install_1.getConfigHome)(), 'notation', 'truststore');
        if (fs.existsSync(trustStorePath)) {
            fs.rmSync(trustStorePath, { recursive: true });
        }
        let trustStoreTypes = getSubdir(trustStoreX509); // [.github/truststore/x509/ca, .github/truststore/x509/signingAuthority, ...]
        for (let i = 0; i < trustStoreTypes.length; ++i) {
            let trustStoreType = path.basename(trustStoreTypes[i]);
            let trustStores = getSubdir(trustStoreTypes[i]); // [.github/truststore/x509/ca/<my_store1>, .github/truststore/x509/ca/<my_store2>, ...]
            for (let j = 0; j < trustStores.length; ++j) {
                let trustStore = trustStores[j]; // .github/truststore/x509/ca/<my_store>
                let trustStoreName = path.basename(trustStore); // <my_store>
                let certFile = getFileFromDir(trustStore); // [.github/truststore/x509/ca/<my_store>/<my_cert1>, .github/truststore/x509/ca/<my_store>/<my_cert2>, ...]
                yield exec.getExecOutput('notation', ['cert', 'add', '-t', trustStoreType, '-s', trustStoreName, ...certFile]);
            }
        }
    });
}
// getSubdir gets all sub dirs under dir without recursive
function getSubdir(dir) {
    return fs.readdirSync(dir, { withFileTypes: true, recursive: false })
        .filter(item => item.isDirectory())
        .map(item => path.join(dir, item.name));
}
// getFileFromDir gets all files under dir without recursive
function getFileFromDir(dir) {
    return fs.readdirSync(dir, { withFileTypes: true, recursive: false })
        .filter(item => !item.isDirectory())
        .map(item => path.join(dir, item.name));
}
if (require.main === module) {
    verify();
}
module.exports = verify;
//# sourceMappingURL=verify.js.map