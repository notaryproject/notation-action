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
import * as fs from 'fs';
import * as path from 'path';

const X509 = "x509";

// verify verifies the target artifact with Notation
async function verify(): Promise<void> {
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

        // configure Notation trust policy
        await exec.getExecOutput('notation', ['policy', 'import', '--force', trust_policy]);
        await exec.getExecOutput('notation', ['policy', 'show']);

        // configure Notation trust store
        await configTrustStore(trust_store);
        await exec.getExecOutput('notation', ['cert', 'ls']);

        // verify core process
        if (allow_referrers_api.toLowerCase() === 'true') {
            // if process.env.NOTATION_EXPERIMENTAL is not set, notation would
            // fail the command as expected.
            await exec.getExecOutput('notation', ['verify', '--allow-referrers-api', target_artifact_ref, '-v']);
        } else {
            await exec.getExecOutput('notation', ['verify', target_artifact_ref, '-v']);
        }
    } catch (e: unknown) {
        if (e instanceof Error) {
            core.setFailed(e);
        } else {
            core.setFailed('unknown error during notation verify');
        }
    }
}

// configTrustStore configures Notation trust store based on specs.
// Reference: https://github.com/notaryproject/specifications/blob/v1.0.0-rc.2/specs/trust-store-trust-policy.md#trust-store
async function configTrustStore(dir: string) {
    let trustStoreX509 = path.join(dir, X509); // .github/truststore/x509
    if (!fs.existsSync(trustStoreX509)) {
        throw new Error(`cannot find trust store dir: ${trustStoreX509}`);
    }
    let trustStoreTypes = getSubdir(trustStoreX509); // [.github/truststore/x509/ca, .github/truststore/x509/signingAuthority, ...]
    for (let i = 0; i < trustStoreTypes.length; ++i) {
        let trustStoreType = path.basename(trustStoreTypes[i]);
        let trustStores = getSubdir(trustStoreTypes[i]); // [.github/truststore/x509/ca/<my_store1>, .github/truststore/x509/ca/<my_store2>, ...]
        for (let j = 0; j < trustStores.length; ++j) {
            let trustStore = trustStores[j]; // .github/truststore/x509/ca/<my_store>
            let trustStoreName = path.basename(trustStore); // <my_store>
            let certFile = getFileFromDir(trustStore); // [.github/truststore/x509/ca/<my_store>/<my_cert1>, .github/truststore/x509/ca/<my_store>/<my_cert2>, ...]
            exec.getExecOutput('notation', ['cert', 'add', '-t', trustStoreType, '-s', trustStoreName, ...certFile]);
        }
    }
}

// getSubdir gets all sub dirs under dir without recursive
function getSubdir(dir: string): string[] {
    return fs.readdirSync(dir, {withFileTypes: true, recursive: false})
        .filter(item => item.isDirectory())
        .map(item => path.join(dir, item.name));
}

// getFileFromDir gets all files under dir without recursive
function getFileFromDir(dir: string): string[] {
    return fs.readdirSync(dir, {withFileTypes: true, recursive: false})
        .filter(item => !item.isDirectory())
        .map(item => path.join(dir, item.name));
}

export = verify;

if (require.main === module) {
    verify();
}