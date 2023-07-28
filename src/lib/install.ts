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

import * as os from 'os';
import * as path from 'path';
  
// Get the URL to download Notatoin CLI
export function getNotationDownloadURL(version: string, url: string) {
  if (url) {
    return url
  }
  const platform = getPlatform();
  const architecture = getArch();
  const filename = `notation_${version}_${platform}_${architecture}`;
  const extension = platform === 'windows' ? 'zip' : 'tar.gz';
  return `https://github.com/notaryproject/notation/releases/download/v${version}/${filename}.${extension}`;
}

// getConfigHome gets Notation config home dir based on platform
// reference: https://notaryproject.dev/docs/concepts/directory-structure/#user-level
export function getConfigHome(): string { 
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
            throw new Error(`Unknown platform: ${platform}`);
    }
}

// getPlatform returns os.platform(), filtered by Notation requirements.
export function getPlatform(): string {
  const platform: string = os.platform();
  switch (platform) {
      case 'linux':
          return 'linux';
      case 'darwin':
          return 'darwin';
      case 'win32':
          return 'windows';
      default:
          throw new Error(`Unsupported platform: ${platform}`);
  }
}

// getArch returns os.arch(), filtered by Notation requirements.
export function getArch(): string {
  const architecture: string = os.arch();
  switch (architecture) {
      case 'x64':
          return 'amd64';
      case 'arm64':
          return 'arm64';
      default:
          throw new Error(`Unsupported architecture: ${architecture}`);
  }
}