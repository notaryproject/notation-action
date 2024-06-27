"use strict";
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
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getNotationDownloadURL = getNotationDownloadURL;
exports.getNotationDownload = getNotationDownload;
exports.getConfigHome = getConfigHome;
exports.getPlatform = getPlatform;
exports.getArch = getArch;
exports.getBinaryExtension = getBinaryExtension;
const os = __importStar(require("os"));
const path = __importStar(require("path"));
const notation_releases_json_1 = __importDefault(require("./data/notation_releases.json"));
// Get the URL to download Notatoin CLI
function getNotationDownloadURL(version, url) {
    if (url) {
        return url;
    }
    const download = getNotationDownload(version);
    return download["url"];
}
// getNotationDownload returns the download object containing url and checksum
// of official Notation CLI release given version
function getNotationDownload(version) {
    const notationRelease = notation_releases_json_1.default;
    const platform = getPlatform();
    const arch = getArch();
    if (!notationRelease[version]) {
        throw new Error(`official Notation CLI release does not support version ${version}`);
    }
    const download = notationRelease[version][platform][arch];
    if (!download) {
        throw new Error(`official Notation CLI release for version ${version}, platform ${platform}, arch ${arch} is not supported`);
    }
    return download;
}
// getConfigHome gets Notation config home dir based on platform
// reference: https://notaryproject.dev/docs/concepts/directory-structure/#user-level
function getConfigHome() {
    const platform = os.platform();
    switch (platform) {
        case 'win32':
            if (!process.env.APPDATA) {
                throw new Error('APPDATA is undefined');
            }
            return process.env.APPDATA;
        case 'darwin':
            return path.join(os.homedir(), 'Library', 'Application Support');
        case 'linux':
            return process.env.XDG_CONFIG_HOME ? process.env.XDG_CONFIG_HOME : path.join(os.homedir(), '.config');
        default:
            throw new Error(`unknown platform: ${platform}`);
    }
}
// getPlatform returns os.platform(), filtered by Notation requirements.
function getPlatform() {
    const platform = os.platform();
    switch (platform) {
        case 'linux':
            return 'linux';
        case 'darwin':
            return 'darwin';
        case 'win32':
            return 'windows';
        default:
            throw new Error(`unsupported platform: ${platform}`);
    }
}
// getArch returns os.arch(), filtered by Notation requirements.
function getArch() {
    const architecture = os.arch();
    switch (architecture) {
        case 'x64':
            return 'amd64';
        case 'arm64':
            return 'arm64';
        default:
            throw new Error(`unsupported architecture: ${architecture}`);
    }
}
function getBinaryExtension() {
    const platform = getPlatform();
    return platform === 'windows' ? '.exe' : '';
}
//# sourceMappingURL=install.js.map