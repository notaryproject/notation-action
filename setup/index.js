const path = require('path');
const core = require('@actions/core');
const tc = require('@actions/tool-cache');
const { getDownloadObject } = require('./lib/utils');
const fs = require('fs');
const mv = require('mv');
const { version } = require('os');
const execSync = require('child_process').execSync;

async function setup() {
  try {
    // Get version of tool to be installed
    const version = core.getInput('version');
    
    // Download the specific version of the tool, e.g. as a tarball/zipball
    const download = getDownloadObject(version);
    console.log(download)
    const pathToTarball = await tc.downloadTool(download.url);

    // Extract the tarball/zipball onto host runner
    const extract = download.url.endsWith('.zip') ? tc.extractZip : tc.extractTar;
    const pathToCLI = await extract(pathToTarball);
    fs.mkdirSync(pathToCLI + "/" + download.binPath, { recursive: true, })

    const currentPath = path.join(pathToCLI, "notation")
    const destinationPath = path.join(pathToCLI, "/", download.binPath, "/", "notation")
    mv(currentPath, destinationPath, function (err) {
      if (err) {
        throw err
      } else {
        console.log("Successfully moved the Notation binary to bin.");
      }
    });
    // Expose the tool by adding it to the PATH
    core.addPath(path.join(pathToCLI, download.binPath));


  } catch (e) {
    core.setFailed(e);
  }
}

module.exports = setup

if (require.main === module) {
  setup();
}