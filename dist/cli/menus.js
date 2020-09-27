"use strict";
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const inquirer = __importStar(require("inquirer"));
exports.amiCheckbox = async (amis, aMsg) => {
    let msg = aMsg !== null && aMsg !== void 0 ? aMsg : 'Select AMIs to build:';
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
            message: msg,
            name: 'amis',
            choices: c
        }
    ]);
    return a['amis'];
};
exports.amiList = async (amis, aMsg) => {
    let msg = aMsg !== null && aMsg !== void 0 ? aMsg : "Select an AMI";
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
            message: msg,
            name: 'amis',
            choices: c
        }
    ]);
    return a['amis'];
};
/*
 * Filter ami + region arguments from the cli
 */
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
                //console.log("NEG: ", s)
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
/*
 * Simple yes/no (y/n) confirmation
 */
exports.confirm = async () => {
    let a = await inquirer.prompt([{
            type: 'confirm',
            message: 'Do you wish to proceed?',
            name: 'conf',
            default: false
        }]);
    return a['conf'];
};
//# sourceMappingURL=menus.js.map