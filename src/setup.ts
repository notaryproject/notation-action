import * as core from '@actions/core';
import * as tc from '@actions/tool-cache';
import {validateCheckSum, getNotationCheckSum} from './lib/checksum';
import { getNotationDownloadURL } from './lib/install';

// setup sets up the Notation CLI.
async function setup(): Promise<void> {
    try {
        // inputs from user
        const version: string = core.getInput('version');
        const notation_url: string = core.getInput('url');
        const notation_checksum = core.getInput('checksum').toLowerCase();

        // sanity check
        if (!(notation_url || version)) {
            throw new Error("user needs to provide either version of official Notation CLI or url of customized Notation CLI release")
        }
        if (notation_url && !notation_checksum) {
            throw new Error("user provided url of customized Notation CLI release but without SHA256 checksum")
        }

        // download Notation CLI and validate checksum
        const downloadURL = getNotationDownloadURL(version, notation_url);
        console.log(`Downloading Notation CLI from ${downloadURL}`);
        const pathToTarball: string = await tc.downloadTool(downloadURL);
        notation_url ? validateCheckSum(pathToTarball, notation_checksum) : validateCheckSum(pathToTarball, getNotationCheckSum(version)); 
        
        // extract the tarball/zipball onto host runner
        const extract = downloadURL.endsWith('.zip') ? tc.extractZip : tc.extractTar;
        const pathToCLI: string = await extract(pathToTarball);
        
        // add `notation` to PATH
        core.addPath(pathToCLI);
    } catch (e) {
        if (e instanceof Error) {
            core.setFailed(e);
        } else {
            core.setFailed('Unknown error during notation setup');
        }
    }
}
  
  export = setup;
  
  if (require.main === module) {
    setup();
  }