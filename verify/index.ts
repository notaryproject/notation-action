import * as core from '@actions/core';
import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

// verify target artifact with Notation
async function verify() {
    try {
        const target_artifact_ref = core.getInput('target_artifact_reference');
        const trust_policy_filepath = core.getInput('trust_policy_filepath');
        const trust_store_dir = core.getInput('trust_certificate_dir'); // .github/truststore
        let output;
        execSync(`notation policy import ${trust_policy_filepath}`);
        output = execSync(`notation policy show`, { encoding: 'utf-8' });
        console.log(output);
        addCerts(trust_store_dir);
        output = execSync(`notation cert ls`, { encoding: 'utf-8' });
        console.log(output);
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

// addCerts adds certificates into Notation trust store.
function addCerts(dir: string) {
    let trustStores = fs.readdirSync(dir, {withFileTypes: true, recursive: false})
    .filter(item => item.isDirectory())
    .map(item => path.resolve(dir, item.name));
    for (let i = 0; i < trustStores.length; ++i) {
        let trustStorePath = trustStores[i];
        let trustStoreName = path.basename(trustStorePath);
        let certFilePaths = fs.readdirSync(trustStorePath, {withFileTypes: true, recursive: false})
                    .filter(item => !item.isDirectory())
                    .map(item => path.resolve(trustStorePath, item.name));
        execSync(`notation cert add -t ca -s ${trustStoreName} ${certFilePaths.join(' ')}`, { encoding: 'utf-8' });
    }
}

export = verify;

if (require.main === module) {
    verify();
}