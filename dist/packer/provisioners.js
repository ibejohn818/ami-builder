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
exports.AnsibleProvisioner = exports.ShellProvisioner = void 0;
const yaml = __importStar(require("js-yaml"));
const path = __importStar(require("path"));
const fs = __importStar(require("fs"));
const types_1 = require("../types");
/**
 * Represents a packer shell provisioner
 *
 */
class ShellProvisioner extends types_1.Provisioner {
    constructor(aName, aSheBang) {
        super(aName, "shell");
        /**
         * a list of shell commands to run
         */
        this._cmds = [];
        /**
         * The shebang for the script
         */
        this._sheBang = "#!/usr/bin/env bash";
        if (aSheBang != undefined) {
            this._sheBang = aSheBang;
        }
    }
    add(cmd) {
        if (cmd instanceof Array) {
            this._cmds = this._cmds.concat(cmd);
        }
        else {
            this._cmds.push(cmd);
        }
    }
    /**
     * create shell provisioner block
     */
    async generate_asset(index, region, aPath) {
        // add the shebang
        let p = {
            type: this.provisionerType,
            inline: this._cmds
        };
        return p;
    }
}
exports.ShellProvisioner = ShellProvisioner;
/**
 * Represents an ansible-local packer provisioner
 */
class AnsibleProvisioner extends types_1.Provisioner {
    /*
    private _preTasks: any[] = [{
        name: 'something something',
        set_facts: "some fact"
    }]
    */
    constructor(aName, aPathToRoles) {
        super(aName, "ansible-local");
        this._roles = [];
        this._postTasks = [];
        this._preTasks = [];
        this._tasks = [];
        // set the path to roles location
        this._pathToRoles = aPathToRoles;
    }
    appendTasks(tasks) {
        this._tasks.push(tasks);
    }
    appendPostTasks(tasks) {
        this._postTasks.push(tasks);
    }
    appendPreTasks(tasks) {
        this._preTasks.push(tasks);
    }
    set tasks(tasks) {
        this._tasks = tasks;
    }
    set preTasks(tasks) {
        this._preTasks = tasks;
    }
    set postTasks(tasks) {
        this._postTasks = tasks;
    }
    get preTasks() {
        return this._preTasks;
    }
    get postTasks() {
        return this._postTasks;
    }
    get tasks() {
        return this._tasks;
    }
    get pathToRoles() {
        return this._pathToRoles;
    }
    addRole(role) {
        this._roles.push(role);
    }
    async generate_asset(index, region, aPath) {
        let pb = {
            become: true,
            become_method: 'sudo',
            hosts: 'all',
            name: this.name,
            roles: []
        };
        if (this._preTasks.length > 0) {
            pb.pre_tasks = this._preTasks;
        }
        if (this._postTasks.length > 0) {
            pb.post_tasks = this._postTasks;
        }
        if (this._tasks.length > 0) {
            pb.tasks = this._tasks;
        }
        // sort roles
        this._roles.sort((a, b) => (a.index > b.index) ? 1 : -1);
        for (var i in this._roles) {
            let role = this._roles[i];
            if (role.vars == undefined) {
                pb.roles.push(role.role);
            }
            else {
                pb.roles.push({
                    role: role.role,
                    vars: role.vars
                });
            }
        }
        let p = path.join(aPath, `playbook-${index}-${region}.yaml`);
        await fs.writeFileSync(p, yaml.dump([pb]));
        return {
            playbook_file: p,
            playbook_dir: this.pathToRoles,
            type: "ansible-local"
        };
    }
}
exports.AnsibleProvisioner = AnsibleProvisioner;
//# sourceMappingURL=provisioners.js.map