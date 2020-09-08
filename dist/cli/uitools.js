"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.drawFooter = exports.clearTerminal = exports.showActive = exports.chunkString = exports.hr = void 0;
const chalk = require("chalk");
const SO = process.stdout;
const ROWS = SO.rows;
const COLS = SO.columns;
const VERSION = require('../../package.json').version;
exports.hr = (length, char = "-") => {
    return "".padEnd(length, char);
};
exports.chunkString = (str, length) => {
    let res = str.match(new RegExp('.{1,' + length + '}', 'g'));
    return res;
};
exports.showActive = (a) => {
    return (a) ? chalk.green("✔") : chalk.red("✘");
};
exports.clearTerminal = () => {
    for (var i = 0; i < ROWS; i++) {
        SO.write("\n");
    }
};
exports.drawFooter = () => {
    let out = [];
    let version = " AMI Builder " + VERSION + " ////";
    out.push(exports.hr(COLS, "/"));
    out.push(version.padStart(COLS, "/"));
    return out;
};
//# sourceMappingURL=uitools.js.map