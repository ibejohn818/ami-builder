import { PackerAmiBuild } from './builder';
export declare class AmiBuildRunner {
    static packerExe: string;
    static packerOps: string[];
    static packerExtraOps: string[];
    private _task;
    private _proc;
    constructor(task: PackerAmiBuild);
    execute(): Promise<void>;
    /**
     * Parse packer machine-readable output.
     * Spec: https://packer.io/docs/commands/index.html
     */
    private parseLine;
    private parseSay;
    private parseMessage;
    private parseAmiId;
}
