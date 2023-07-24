import * as crypto from 'crypto';
import * as fs from 'fs';
import {getPlatform, getArch} from '../lib/install';

// validateCheckSum validates checksum of file at path against user input
// ground truth.
export function validateCheckSum(path: string, groundTruth: string) {
    const buff = fs.readFileSync(path);
    const sha256 = hash(buff);
    if (sha256 !== groundTruth) {
        throw new Error(`checksum of downloaded plugin ${sha256} does not match user input ${groundTruth}`);
    }
    console.log("Successfully checked download checksum against user input")
}

// getNotationCheckSum returns checksum of user specified official Notation CLI
// release.
export function getNotationCheckSum(version: string): string {
    const versionData = fs.readFileSync("./data/notation_releases.json", 'utf8');
    const versionList = JSON.parse(versionData);
    const platform = getPlatform();
    const architecture = getArch();
    for (const release of versionList) {
        if (release["version"] === version) {
            return release[platform][architecture]["checksum"];
        }
    }
    throw new Error(`Notation release does not support user input version ${version}`);
}

// hash computes SH256 of src file.
function hash(src: Buffer) {
    return crypto.createHash('sha256').update(src).digest('hex').toLowerCase();
}