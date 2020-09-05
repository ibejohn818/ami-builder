import * as yaml from 'js-yaml'
import * as path from 'path'
import * as fs from 'fs'
import * as builder from './builder'
import {
    Provisioner,
    AnsibleRole,
    PlaybookJson,
    Regions,
} from '../types'

/**
 * Represents a packer shell provisioner
 *
 */
export class ShellProvisioner extends Provisioner {
    /**
     * a list of shell commands to run
     */
    private _cmds: string[] = []

    /**
     * The shebang for the script
     */
    private _sheBang: string = "#!/usr/bin/env bash"

    constructor(aName: string, aSheBang?: string) {
        super(aName, "shell")

        if (aSheBang != undefined) {
            this._sheBang = aSheBang
        }
    }

    public add(cmd: string | string[]): void {
        if (cmd instanceof Array) {
            this._cmds = this._cmds.concat(cmd)
        } else {
            this._cmds.push(cmd)
        }
    }

    /**
     * create shell provisioner block
     */
    public generate(region: Regions, aPath: string): {[key: string]: any} {
        // add the shebang
        let p = {
            type: this.provisionerType,
            inline: this._cmds
        }
        return p
    }

}


/**
 * Represents an ansible-local packer provisioner
 */
export class AnsibleProvisioner extends Provisioner {

    /**
     * The path to the ansible roles used by this provisioner
     */
    private _pathToRoles: string
    private _roles: Array<AnsibleRole> = []
    private _postTasks: any[] = []
    private _preTasks: any[] = [{
        name: 'something something',
        set_facts: "some fact"
    }]

    constructor(aName: string, aPathToRoles: string) {
        super(aName, "ansible-local")

        // set the path to roles location
        this._pathToRoles = aPathToRoles
    }

    public get pathToRoles(): string {
        return this._pathToRoles
    }

    public addRole(role: AnsibleRole): void {
        this._roles.push(role)
    }


    public generate(region: Regions, aPath: string): {[key: string]: any} {

        let pb: PlaybookJson = {
            become: true,
            become_method: 'sudo',
            hosts: 'all',
            name: this.name,
            roles: []
        }
        // sort roles
        this._roles.sort((a: AnsibleRole, b: AnsibleRole) => (a.index > b.index) ? 1:-1)

        for (var i in this._roles) {
            let role = this._roles[i]

            if (role.vars == undefined) {
                pb.roles.push(role.role)
            } else {
                pb.roles.push({
                    role: role.role,
                    vars: role.vars
                })
            }

        }

        //if (this._preTasks.length > 0) {
            //pb.pre_tasks = this._preTasks
        //}

        let p = path.join(aPath, `playbook-${region}.yaml`)

        fs.writeFileSync(p, yaml.dump([pb]))


        return {
            playbook_file: p,
            playbook_dir: this.pathToRoles,
            type: "ansible-local"

        }
    }

}
