import { Provisioner, AnsibleRole, PlaybookTaskBlock, Regions } from '../types';
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
    generate_asset(index: number, region: Regions, aPath: string): Promise<{
        [key: string]: any;
    }>;
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
    private _tasks;
    constructor(aName: string, aPathToRoles: string);
    appendTasks(tasks: PlaybookTaskBlock): void;
    appendPostTasks(tasks: PlaybookTaskBlock): void;
    appendPreTasks(tasks: PlaybookTaskBlock): void;
    set tasks(tasks: PlaybookTaskBlock[]);
    set preTasks(tasks: PlaybookTaskBlock[]);
    set postTasks(tasks: PlaybookTaskBlock[]);
    get preTasks(): PlaybookTaskBlock[];
    get postTasks(): PlaybookTaskBlock[];
    get tasks(): PlaybookTaskBlock[];
    get pathToRoles(): string;
    addRole(role: AnsibleRole): void;
    generate_asset(index: number, region: Regions, aPath: string): Promise<{
        [key: string]: any;
    }>;
}
