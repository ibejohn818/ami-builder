import * as AWS from 'aws-sdk'

export enum Regions {
    USWEST1 = "us-west-1",
    USWEST2 = "us-west-2",
    USEAST1 = "us-east-1",
    USEAST2 = "us-east-2"
}

export enum EditOption {
    None,
    Promote,
    Description
}

export interface FileExtSplit {
    filename: string
    ext: string
}

export interface PackerBuildProps {
    sshUser: string,
    path?: string
    debug?: boolean
}

export interface PackerBuildVar {
    key: string
    value: string
}

export interface PackerAmiBuildProps  extends PackerBuildProps {
    instanceType?: string
}

export interface PackerAmiProvisionerAsset {
    path: string
}

export interface PackerAmiProvisioner {
   index: number
   provisioner: Provisioner
   assets?: PackerAmiProvisionerAsset[]
}

export interface AmiId  {
    id?: string
    image?: Promise<AWS.EC2.Image>
}


export interface PackerFileJson {
    builders: {[key: string]: any}[]
    provisioners: {[key: string]: any}[]
}

export interface Tag {
    key: string,
    value: string
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

/*
 * Ansible playbook in json exportable format
 * TODO: implement out the weak "any" types
 */
export interface PlaybookJson {
    become: boolean
    become_method: string
    hosts: string
    name: string
    roles: any[]
    pre_tasks?: any[]
    post_tasks?: any[]
    tasks?: any[]
}

export interface PackerAmiBuild {
    name: string,
    region: Regions
    packerFile: string
    path: string
    tags?: Tag[]

}

export interface AwsActiveSdkInstance {
    id: string
    name: string,
    launchTime: string,
}

export interface AmiActiveInstances extends AwsActiveSdkInstance {}


export interface AmiBuildImage {
    id: string
    name: string
    region: Regions
    active: boolean
    tags: Tag[],
    userTags?: Tag[],
    created: AmiDate
    description?: string
}



export interface AmiBuildImageInspect extends AmiBuildImage {
    activeInstances: AmiActiveInstances[]
}

/**
* Interface of a the PackerAmi instance that generates
* the packer file and it's build assets
*/ 
export abstract class IPackerAmi {
    /**
     *  Method for an AMI to get its default AMI ID to use
     *  as the base for the build.
     * @param region 
     */
    abstract getAmiId(region: Regions): Promise<string>

    /**
     * Generate build assets
     */
    abstract generate(region: Regions, path?: string): Promise<PackerAmiBuild>
}
export abstract class IPackerBuild {
    /**
     *  Method for an AMI to get its default AMI ID to use
     *  as the base for the build.
     * @param region 
     */
    abstract getAmiId(region: Regions): Promise<string>

    /**
     * Generate build assets
     */
    abstract generate(region: Regions, path?: string): Promise<PackerAmiBuild>
}

export interface AmiQueuedBuild {
    packerAmi: IPackerAmi
    name: string
    region: Regions
}

export interface AmiBuildRunnerProps {
    verbose?: boolean
    promoteActive?: boolean
    isActive?: boolean
    isTagged?: boolean
    isStarted?: boolean
    currentLogLine?: string
    logLine?: string
    logTarget?: string
    logType?: string
    description?: string
}

export type PlaybookTaskBlock = {[key: string]: any}

export const ShortDateFormat = new Intl.DateTimeFormat('en', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit',minute: '2-digit', second: '2-digit' });

export class AmiDate extends Date {
    public prettyDate(): string {
        return ShortDateFormat.format(this)
    }
}

/*
 * Packer provisioner implementation
 */
export abstract class Provisioner {

    protected _name: string
    protected _provisionerType: string
    protected _packerVars: PackerBuildVar[] = []

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

    public get safeName(): string {
        return this._name.replace(' ', '-')
    }

    public randSeed(length: number = 16): string {
        let ops = "123456789abcdefghijklmnopqrstuvwxyz"
        let seed = ""
        for (var i=1; i<=length; i++) {
            var rand = Math.floor(Math.random() * ops.length)
            seed += ops[rand]
        }
        return seed
    }

    abstract generate_asset(index: number,region: Regions, path: string): Promise<{[key: string]: any}>

}

export interface AmiMap {
    [key: string]: string
}

export type AmiIdLookupMap = Record<string, string>
