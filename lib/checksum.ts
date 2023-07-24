import * as crypto from 'crypto';
import * as fs from 'fs';
import {getPlatform, getArch} from './install';
import notationReleases from './data/notation_releases.json';

// validateCheckSum validates checksum of file at path against ground truth.
export function validateCheckSum(path: string, groundTruth: string) {
    const buff = fs.readFileSync(path);
    const sha256 = hash(buff);
    if (sha256 !== groundTruth) {
        throw new Error(`checksum of downloaded plugin ${sha256} does not match ground truth ${groundTruth}`);
    }
    console.log("Successfully checked download checksum against ground truth")
}

// getNotationCheckSum returns checksum of user specified official Notation CLI
// release.
export function getNotationCheckSum(version: string): string {
    const platform = getPlatform();
    const architecture = getArch();
    for (const release of notationReleases as any) {
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