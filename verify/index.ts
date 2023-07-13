import * as core from '@actions/core';
import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

const X509 = "x509";

// verify target artifact with Notation
async function verify() {
    try {
        const target_artifact_ref = core.getInput('target_artifact_reference');
        const trust_policy = core.getInput('trust_policy');
        const trust_store = core.getInput('trust_store'); // .github/truststore
        let output;
        // configure Notation trust policy
        execSync(`notation policy import ${trust_policy}`);
        output = execSync(`notation policy show`, { encoding: 'utf-8' });
        console.log(output);
        // configure Notation trust store
        configTrustStore(trust_store);
        output = execSync(`notation cert ls`, { encoding: 'utf-8' });
        console.log(output);
        // verify core logic
        if (process.env.NOTATION_EXPERIMENTAL) {
            output = execSync(`notation verify --allow-referrers-api ${target_artifact_ref} -v`, { encoding: 'utf-8' });
        } else {
            output = execSync(`notation verify ${target_artifact_ref} -v`, { encoding: 'utf-8' });
        }
        console.log('notation verify output:\n', output);
    } catch (e: unknown) {
        if (e instanceof Error) {
            core.setFailed(e);
        } else {
            core.setFailed('Unknown error');
        }
    }
}

// configTrustStore configures Notation trust store based on specs.
// Reference: https://github.com/notaryproject/notaryproject/blob/main/specs/trust-store-trust-policy.md#trust-store
function configTrustStore(dir: string) {
    let trustStoreX509 = path.resolve(dir, X509); // .github/truststore/x509
    if (!fs.existsSync(trustStoreX509)) {
        throw new Error("cannot find dir: <trust_store>/x509");
    }
    let trustStoreTypes = getSubdir(trustStoreX509); // [.github/truststore/x509/ca, .github/truststore/x509/signingAuthority, ...]
    for (let i = 0; i < trustStoreTypes.length; ++i) {
        let trustStores = getSubdir(trustStoreTypes[i]); // [.github/truststore/x509/ca/<my_store1>, .github/truststore/x509/ca/<my_store2>, ...]
        for (let j = 0; j < trustStores.length; ++j) {
            let trustStore = trustStores[j]; // .github/truststore/x509/ca/<my_store>
            let trustStoreName = path.basename(trustStore); // <my_store>
            let certFile = getFileFromDir(trustStore); // [.github/truststore/x509/ca/<my_store>/<my_cert1>, .github/truststore/x509/ca/<my_store>/<my_cert2>, ...]
            execSync(`notation cert add -t ${trustStoreTypes[i]} -s ${trustStoreName} ${certFile.join(' ')}`, { encoding: 'utf-8' });
        }
    }
}

// getSubdir gets all sub dirs under dir without recursive
function getSubdir(dir: string): string[] {
    return fs.readdirSync(dir, {withFileTypes: true, recursive: false})
    .filter(item => item.isDirectory())
    .map(item => path.resolve(dir, item.name));
}

// getSubdir gets all files under dir without recursive
function getFileFromDir(dir: string): string[] {
    return fs.readdirSync(dir, {withFileTypes: true, recursive: false})
    .filter(item => !item.isDirectory())
    .map(item => path.resolve(dir, item.name));
}

export = verify;

if (require.main === module) {
    verify();
}