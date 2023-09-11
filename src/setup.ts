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
import * as tc from '@actions/tool-cache';
import {hash, getNotationCheckSum} from './lib/checksum';
import { getNotationDownloadURL } from './lib/install';

// setup sets up the Notation CLI.
async function setup(): Promise<void> {
    try {
        // inputs from user
        const version: string = core.getInput('version');
        const notation_url: string = core.getInput('url');
        const notation_checksum = core.getInput('checksum').toLowerCase();

        // sanity check
        if (notation_url && !notation_checksum) {
            throw new Error("user provided url of customized Notation CLI release but without SHA256 checksum");
        }

        // download Notation CLI and validate checksum
        const downloadURL = getNotationDownloadURL(version, notation_url);
        console.log(`downloading Notation CLI from ${downloadURL}`);
        const pathToTarball: string = await tc.downloadTool(downloadURL);
        console.log("downloading Notation CLI completed");
        const sha256 = await hash(pathToTarball);
        const expectedCheckSum = notation_url ? notation_checksum : getNotationCheckSum(version);
        if (sha256 !== expectedCheckSum) {
            throw new Error(`checksum of downloaded Notation CLI ${sha256} does not match expected checksum ${expectedCheckSum}`);
        }
        console.log("successfully verified download checksum");
        
        // extract the tarball/zipball onto host runner
        const extract = downloadURL.endsWith('.zip') ? tc.extractZip : tc.extractTar;
        const pathToCLI: string = await extract(pathToTarball);
        
        // add `notation` to PATH
        core.addPath(pathToCLI);
    } catch (e) {
        if (e instanceof Error) {
            core.setFailed(e);
        } else {
            core.setFailed('unknown error during notation setup');
        }
    }
}
  
export = setup;

if (require.main === module) {
    setup();
}