import { Provisioner, AnsibleRole, Regions } from '../types';
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
    generate(region: Regions, aPath: string): {
        [key: string]: any;
    };
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
    private _postTasks;
    private _preTasks;
    constructor(aName: string, aPathToRoles: string);
    get pathToRoles(): string;
    addRole(role: AnsibleRole): void;
    generate(region: Regions, aPath: string): {
        [key: string]: any;
    };
}
