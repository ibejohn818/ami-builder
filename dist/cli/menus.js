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
exports.confirm = exports.fuzzyFilter = exports.amiList = exports.amiCheckbox = void 0;
const inquirer = __importStar(require("inquirer"));
exports.amiCheckbox = async (amis) => {
    let c = [];
    amis.forEach((v) => {
        c.push({
            name: `${v.name} [${v.region}]`,
            value: v
        });
    });
    let a = await inquirer.prompt([
        {
            type: 'checkbox',
            message: 'Select AMIs to build: ',
            name: 'amis',
            choices: c
        }
    ]);
    return a['amis'];
};
exports.amiList = async (amis) => {
    let c = [];
    amis.forEach((v) => {
        c.push({
            name: `${v.name} [${v.region}]`,
            value: v
        });
    });
    let a = await inquirer.prompt([
        {
            type: 'list',
            message: 'Select an AMI',
            name: 'amis',
            choices: c
        }
    ]);
    return a['amis'];
};
exports.fuzzyFilter = (amis, names) => {
    let r = [];
    amis.forEach((v) => {
        let y = false;
        let n = `${v.name} ${v.region}`;
        for (var i in names) {
            var s = names[i];
            var p = true;
            if (/^\^/.test(s)) {
                p = false;
                s = s.replace(/^(\^)(.*)/, '$2');
                console.log("NEG: ", s);
            }
            if (n.indexOf(s) >= 0) {
                y = p;
            }
        }
        if (y) {
            r.push(v);
        }
    });
    return r;
};
exports.confirm = async () => {
    let a = await inquirer.prompt([{
            type: 'confirm',
            message: 'you want to proceed?',
            name: 'conf',
            default: false
        }]);
    return a['conf'];
};
//# sourceMappingURL=menus.js.map