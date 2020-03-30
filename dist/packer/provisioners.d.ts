import * as builder from './builder';
export declare abstract class Provisioner {
    protected _name: string;
    protected _provisionerType: string;
    constructor(aName: string, aProvisionerType: string);
    get provisionerType(): string;
    get name(): string;
    abstract generate(region: builder.Regions, path: string): {
        [key: string]: any;
    };
}
/**
 * Represents a packer shell provisioner
 *
 */
export declare class ShellProvisioner extends Provisioner {
    /**
     * a list of shell commands to run
     */
    private _cmds;
    /**
     * The shebang for the script
     */
    private _sheBang;
    constructor(aName: string, aSheBang?: string);
    add(cmd: string | string[]): void;
    /**
     * create shell provisioner block
     */
    generate(region: builder.Regions, aPath: string): {
        [key: string]: any;
    };
}
/**
 * A contract representing an ansible role
 *
 * @property
 */
export interface AnsibleRole {
    role: string;
    index: number;
    vars?: {
        [key: string]: any;
    };
}
export interface PlaybookJson {
    become: boolean;
    become_method: string;
    hosts: string;
    name: string;
    roles: any[];
}
/**
 * Represents an ansible-local packer provisioner
 */
export declare class AnsibleProvisioner extends Provisioner {
    /**
     * The path to the ansible roles used by this provisioner
     */
    private _pathToRoles;
    private _roles;
    constructor(aName: string, aPathToRoles: string);
    get pathToRoles(): string;
    addRole(role: AnsibleRole): void;
    test1(): void;
    test2(): void;
    generate(region: builder.Regions, aPath: string): {
        [key: string]: any;
    };
}
