const { setFailed } = require('@actions/core');
const os = require('os');
const path = require('path');
const execSync = require('child_process').execSync;
const semver = require('semver');
const core = require('@actions/core');
const arch = "amd64";

// os in [darwin, linux, win32...] (https://nodejs.org/api/os.html#os_os_platform)
// return value in [darwin, linux, windows]
function mapOS(os) {
    const mappings = {
        darwin: 'macOS',
        win32: 'windows'
    };
    return mappings[os] || os;
}

function getDownloadObject(version) {
    const platform = os.platform();
    const filename = `notation_${version}_${mapOS(platform)}_${arch}`;
    const extension = platform === 'win32' ? 'zip' : 'tar.gz';
    const binPath = platform === 'win32' ? 'bin' : path.join(filename, 'bin');
    const url = `https://github.com/notaryproject/notation/releases/download/v${version}/${filename}.${extension}`;
    return {
        url,
        binPath,
        filename
    };
}

module.exports = { getDownloadObject, getDownloadPluginObject }