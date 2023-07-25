"use strict";
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
exports.getNotationCheckSum = exports.validateCheckSum = void 0;
const crypto = __importStar(require("crypto"));
const fs = __importStar(require("fs"));
const install_1 = require("./install");
const notation_releases_json_1 = __importDefault(require("./data/notation_releases.json"));
// validateCheckSum validates checksum of file at path against ground truth.
function validateCheckSum(path, groundTruth) {
    const buff = fs.readFileSync(path);
    const sha256 = hash(buff);
    if (sha256 !== groundTruth) {
        throw new Error(`checksum of downloaded plugin ${sha256} does not match ground truth ${groundTruth}`);
    }
    console.log("Successfully checked download checksum against ground truth");
}
exports.validateCheckSum = validateCheckSum;
// getNotationCheckSum returns checksum of user specified official Notation CLI
// release.
function getNotationCheckSum(version) {
    const platform = (0, install_1.getPlatform)();
    const architecture = (0, install_1.getArch)();
    for (const release of notation_releases_json_1.default) {
        if (release["version"] === version) {
            return release[platform][architecture]["checksum"];
        }
    }
    throw new Error(`Notation release does not support user input version ${version}`);
}
exports.getNotationCheckSum = getNotationCheckSum;
// hash computes SH256 of src file.
function hash(src) {
    return crypto.createHash('sha256').update(src).digest('hex').toLowerCase();
}
//# sourceMappingURL=checksum.js.map