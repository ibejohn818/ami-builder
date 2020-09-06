import { PackerAmiBuild, AmiBuildRunnerProps } from '../types';
export declare class AmiBuildRunner {
    static packerExe: string;
    static packerOps: string[];
    static packerExtraOps: string[];
    private _task;
    private _proc;
    private _props;
    private _newAmiId?;
    private idFound;
    private msgData;
    private msgTarget;
    private msgType;
    constructor(task: PackerAmiBuild, props?: AmiBuildRunnerProps);
    get props(): AmiBuildRunnerProps;
    get task(): PackerAmiBuild;
    get newAmiId(): string | undefined;
    get consoleAmiLink(): string;
    execute(): Promise<void>;
    /**
     * Parse packer machine-readable output.
     * Spec: https://packer.io/docs/commands/index.html
     */
    private parseLine;
    private formatPackerData;
    private parseSay;
    private parseMessage;
    private parseAmiId;
}
