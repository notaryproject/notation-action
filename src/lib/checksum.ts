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

import * as crypto from 'crypto';
import * as fs from 'fs';
import {getPlatform, getArch} from './install';
import notationReleases from './data/notation_releases.json';

// getNotationCheckSum returns checksum of user specified official Notation CLI
// release.
export function getNotationCheckSum(version: string): string {
    const platform = getPlatform();
    const architecture = getArch();
    for (const release of notationReleases as any) {
        if (release["version"] === version) {
            console.log(`Notation CLI version is ${version}`);
            let checksum = release[platform][architecture]["checksum"];
            console.log(`Notation CLI checksum is ${checksum}`);
            return checksum;
        }
    }
    throw new Error(`Notation CLI release does not support user input version ${version}`);
}

// hash computes SH256 of file at path.
export function hash(path: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const hash = crypto.createHash('sha256');
      const stream = fs.createReadStream(path);
      stream.on('error', err => reject(err));
      stream.on('data', chunk => hash.update(chunk));
      stream.on('end', () => resolve(hash.digest('hex')));
    });
}
