import * as yaml from 'js-yaml'
import * as path from 'path'
import * as fs from 'fs'
import * as builder from './builder'

export abstract class Provisioner {

    protected _name: string
    protected _provisionerType: string

    constructor(aName: string, aProvisionerType: string) {
        this._name = aName
        this._provisionerType = aProvisionerType
    }

    public get provisionerType(): string {
        return this._provisionerType
    }

    public get name(): string {
        return this._name
    }

    abstract generate(region: builder.Regions, path: string): {[key: string]: any}

}
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
    public generate(region: builder.Regions, aPath: string): {[key: string]: any} {
        // add the shebang
        let p = {
            type: this.provisionerType,
            inline: this._cmds
        }
        return p
    }

}



/**
 * A contract representing an ansible role
 *
 * @property
 */
export interface AnsibleRole {
    role: string
    index: number
    vars?: {[key: string]: any}
}

export interface PlaybookJson {

    become: boolean
    become_method: string
    hosts: string
    name: string
    roles: any[]

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

    public test1() {

    }

    public test2() {

    }

    public generate(region: builder.Regions, aPath: string): {[key: string]: any} {

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

        let p = path.join(aPath, `playbook-${region}.yaml`)

        fs.writeFileSync(p, yaml.dump([pb]))


        return {
            playbook_file: p,
            playbook_dir: this.pathToRoles,
            type: "ansible-local"

        }
    }

}