const path = require('path');
const core = require('@actions/core');
const tc = require('@actions/tool-cache');
const { getDownloadObject, getDownloadPluginObject, addPluginCert} = require('./lib/utils');
const fs = require('fs');
const mv = require('mv');
const { version } = require('os');
const execSync = require('child_process').execSync;

async function setup() {
  try {
    // Get version of tool to be installed
    const version = core.getInput('version');
    const keyName = core.getInput('key_name');
    
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
    fs.rename(currentPath, destinationPath, function (err) {
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

async function setupPlugin(name, version, keyName) {
  try {
    const keyId = core.getInput('certificate_key_id');
    const download = getDownloadPluginObject(name, version)
    console.log(download)

    fs.mkdirSync(download.pluginPath, { recursive: true, })

    const pathToTarball = await tc.downloadTool(download.url);
    const extract = download.url.endsWith('.zip') ? tc.extractZip : tc.extractTar;
    const pathToPluginDownload = await extract(pathToTarball);

    const currentPath = path.join(pathToPluginDownload, "/", name)
    const destinationPath = path.join(download.pluginPath, "/", name)

    mv(currentPath, destinationPath, function (err) {
      if (err) {
        throw err
      } else {
        console.log("Successfully moved the plugin file!");
        fs.chmod(destinationPath, 0o755, (err) => {
          if (err) throw err;
          console.log(`The permissions for file "${destinationPath}" have been changed!`);
        });
        addPluginCert(keyName,keyId);
      }
    });
  } catch (e) {
    core.setFailed(e);
  }
}

module.exports = setup
module.exports = setupPlugin

if (require.main === module) {
  setup();
}