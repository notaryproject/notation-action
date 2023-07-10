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

function getDownloadPluginObject(name, version) {
    if (name == "notation-azure-kv") {
        const platform = os.platform();
        const filename = `${name}_${version}_${mapOS(platform)}_${arch}`;
        const extension = platform === 'win32' ? 'zip' : 'tar.gz';
        const url = `https://github.com/Azure/notation-azure-kv/releases/download/v${version}/${filename}.${extension}`;
        const HOME = process.env.HOME;
        const pluginPath = HOME + "/.config/notation/plugins/azure-kv"
        return {
            url,
            filename,
            pluginPath
        };
    } else { // Add logic for additional Notation plugins here
        setFailed(`Plugin ${name} is not currently supported`)
    }
}

function addPluginCert(keyName,keyId){
    if (keyId.includes('vault.azure.net')){
        const output = execSync(`notation key add --plugin azure-kv --id ${keyId} --default ${keyName}`, { encoding: 'utf-8' });
        console.log('notation cert output:\n', output);
    } // Add logic for additional Notation plugins here
}

function versionCheck(version){
    const supportedVersion = '0.12.0-beta.1'
    if (semver.lt(version, supportedVersion)) {
        core.setFailed('Unsupported NotationCli version');
        throw new Error(`NotationCli v${version} is not supported by this version of the setup_notation GitHub Action.`);
    }
}

module.exports = { getDownloadObject, getDownloadPluginObject, addPluginCert, versionCheck}