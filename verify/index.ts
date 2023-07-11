import * as core from '@actions/core';
import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

// verify target artifact with Notation
async function verify() {
    try {
        const target_artifact_ref = core.getInput('target_artifact_reference');
        const trust_policy_filepath = core.getInput('trust_policy_filepath');
        const trust_store_name = core.getInput('trust_store_name');
        const trust_certificate_dir = core.getInput('trust_certificate_dir');
        let certFiles = readDir(trust_certificate_dir);
        let output;
        execSync(`notation policy import ${trust_policy_filepath}`);
        output = execSync(`notation policy show`, { encoding: 'utf-8' });
        console.log(output);
        execSync(`notation cert add -t ca -s ${trust_store_name} ${certFiles.join(' ')}`, { encoding: 'utf-8' });
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

// readDir returns a list of file names under input dir.
function readDir(dir: string): string[] {
    return fs.readdirSync(dir, {withFileTypes: true, recursive: false})
      .filter(item => !item.isDirectory())
      .map(item => path.resolve(dir, item.name));
}

export = verify;

if (require.main === module) {
    verify();
}