import * as AWS from 'aws-sdk';
export declare enum Regions {
    USWEST1 = "us-west-1",
    USWEST2 = "us-west-2",
    USEAST1 = "us-east-1",
    USEAST2 = "us-east-2"
}
export declare enum EditOption {
    None = 0,
    Promote = 1,
    Description = 2
}
export interface FileExtSplit {
    filename: string;
    ext: string;
}
export interface PackerBuildProps {
    sshUser: string;
    path?: string;
    debug?: boolean;
}
export interface PackerBuildVar {
    key: string;
    value: string;
}
export interface PackerAmiBuildProps extends PackerBuildProps {
    instanceType?: string;
}
export interface PackerAmiProvisionerAsset {
    path: string;
}
export interface PackerAmiProvisioner {
    index: number;
    provisioner: Provisioner;
    assets?: PackerAmiProvisionerAsset[];
}
export interface AmiId {
    id?: string;
    image?: Promise<AWS.EC2.Image>;
}
export interface PackerFileJson {
    builders: {
        [key: string]: any;
    }[];
    provisioners: {
        [key: string]: any;
    }[];
}
export interface Tag {
    key: string;
    value: string;
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
    pre_tasks?: any[];
    post_tasks?: any[];
    tasks?: any[];
}
export interface PackerAmiBuild {
    name: string;
    region: Regions;
    packerFile: string;
    path: string;
    tags?: Tag[];
}
export interface AwsActiveSdkInstance {
    id: string;
    name: string;
    launchTime: string;
}
export interface AmiActiveInstances extends AwsActiveSdkInstance {
}
export interface AmiBuildImage {
    id: string;
    name: string;
    region: Regions;
    active: boolean;
    tags: Tag[];
    userTags?: Tag[];
    created: AmiDate;
    description?: string;
}
export interface AmiBuildImageInspect extends AmiBuildImage {
    activeInstances: AmiActiveInstances[];
}
/**
* Interface of a the PackerAmi instance that generates
* the packer file and it's build assets
*/
export declare abstract class IPackerAmi {
    /**
     *  Method for an AMI to get its default AMI ID to use
     *  as the base for the build.
     * @param region
     */
    abstract getAmiId(region: Regions): Promise<string>;
    /**
     * Generate build assets
     */
    abstract generate(region: Regions, path?: string): Promise<PackerAmiBuild>;
}
export declare abstract class IPackerBuild {
    /**
     *  Method for an AMI to get its default AMI ID to use
     *  as the base for the build.
     * @param region
     */
    abstract getAmiId(region: Regions): Promise<string>;
    /**
     * Generate build assets
     */
    abstract generate(region: Regions, path?: string): Promise<PackerAmiBuild>;
}
export interface AmiQueuedBuild {
    packerAmi: IPackerAmi;
    name: string;
    region: Regions;
}
export interface AmiBuildRunnerProps {
    verbose?: boolean;
    promoteActive?: boolean;
    isActive?: boolean;
    isTagged?: boolean;
    isStarted?: boolean;
    currentLogLine?: string;
    logLine?: string;
    logTarget?: string;
    logType?: string;
    description?: string;
}
export declare type PlaybookTaskBlock = {
    [key: string]: any;
};
export declare const ShortDateFormat: Intl.DateTimeFormat;
export declare class AmiDate extends Date {
    prettyDate(): string;
}
export declare abstract class Provisioner {
    protected _name: string;
    protected _provisionerType: string;
    protected _packerVars: PackerBuildVar[];
    constructor(aName: string, aProvisionerType: string);
    get provisionerType(): string;
    get name(): string;
    get safeName(): string;
    randSeed(length?: number): string;
    abstract generate_asset(index: number, region: Regions, path: string): Promise<{
        [key: string]: any;
    }>;
}
export interface AmiMap {
    [key: string]: string;
}
export declare type AmiIdLookupMap = Record<string, string>;
