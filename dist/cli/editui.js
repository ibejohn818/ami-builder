"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
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
    if (mod != null) for (var k in mod) if (k !== "default" && Object.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.editOptions = exports.listAmis = void 0;
const inquirer = __importStar(require("inquirer"));
const tagger = __importStar(require("../ami/tagger"));
const uitools = __importStar(require("./uitools"));
const types_1 = require("../types");
const chalk = require("chalk");
exports.listAmis = async (name, region) => {
    let msg = "Select an ami to edit: ";
    let ls = new tagger.AmiList(name, region);
    let c = [];
    let res = await ls.inspectAmiList();
    if (res.length <= 0) {
        console.log("No ami's are published");
        process.exit(0);
    }
    res.forEach((v) => {
        let ln = `${uitools.showActive(v.active)} - ${chalk.green(v.id)}`;
        ln += `\n   - Published: ${chalk.blue(v.created)}`;
        if (v.description != undefined)
            ln += `\n   - Description: ${chalk.bold.white(v.description)} \n`;
        c.push({
            name: ln,
            value: v
        });
    });
    let a = await inquirer.prompt([
        {
            type: 'list',
            message: msg,
            name: 'ami',
            choices: c
        }
    ]);
    return a['ami'];
};
exports.editOptions = async () => {
    let msg = "Choose an edit option: ";
    let a = await inquirer.prompt([
        {
            type: 'list',
            message: msg,
            name: 'op',
            choices: [
                {
                    name: "Promote to active",
                    value: types_1.EditOption.Promote
                },
                {
                    name: "Edit Description",
                    value: types_1.EditOption.Description
                },
            ]
        }
    ]);
    return a['op'];
};
//# sourceMappingURL=editui.js.map