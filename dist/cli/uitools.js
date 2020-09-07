"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.clearTerminal = exports.showActive = exports.chunkString = exports.hr = void 0;
const chalk = require("chalk");
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
    let so = process.stdout;
    let rows = so.rows;
    for (var i = 0; i < rows; i++) {
        so.write("\n");
    }
};
//# sourceMappingURL=uitools.js.map