import { PackerAmiBuild, AmiBuildRunnerProps } from '../types';
declare class Logger {
    private logHandle?;
    private _build;
    private _logCreated;
    constructor(aBuild: PackerAmiBuild);
    private createStream;
    private genFileName;
    write(data: string, from?: string): void;
    close(): void;
}
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
    private _logger;
    private _isTagging;
    constructor(task: PackerAmiBuild, props?: AmiBuildRunnerProps);
    get props(): AmiBuildRunnerProps;
    get logger(): Logger;
    get task(): PackerAmiBuild;
    get newAmiId(): string | undefined;
    get isTagging(): boolean;
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
    private _taggingAttemps;
    tagAmi(): Promise<void>;
}
export {};
