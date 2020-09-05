import * as AWS from 'aws-sdk'

export enum Regions {
    USWEST1 = "us-west-1",
    USWEST2 = "us-west-2",
    USEAST1 = "us-east-1",
    USEAST2 = "us-east-2"
}

/*
 * Packer provisioner implementation
 */
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

    abstract generate(region: Regions, path: string): {[key: string]: any}

}

export interface PackerAmiProvisioner {
   index: number
   provisioner: Provisioner
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

}

export interface PackerAmiBuild {
    name: string,
    region: Regions
    packerFile: string
    path: string
    tags?: Tag[]
}

export abstract class IPackerAmi {
    /**
     *  Method for an AMI to get its default AMI ID to use
     *  as the base for the build.
     * @param region 
     */
    abstract getAmiId(region: Regions): Promise<string>

    abstract generate(region: Regions, path?: string): Promise<PackerAmiBuild>
}
export interface AmiQueuedBuild {
    packerAmi: IPackerAmi
    name: string
    region: Regions
}