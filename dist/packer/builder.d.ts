import * as prov from './provisioners';
import * as ami_module from '../ami/ami';
interface PackerAmiProvisioner {
    index: number;
    provisioner: prov.Provisioner;
}
export interface AmiId {
    id?: string;
    image?: Promise<ami_module.Image>;
}
export declare enum Regions {
    USWEST1 = "us-west-1",
    USWEST2 = "us-west-2",
    USEAST1 = "us-east-1",
    USEAST2 = "us-east-2"
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
export interface PackerAmiBuild {
    name: string;
    region: Regions;
    packerFile: string;
    tags?: Tag[];
}
export declare abstract class PackerAmi {
    private _name;
    protected provisioners: Array<PackerAmiProvisioner>;
    private sshUser;
    protected path: string;
    protected packerJson: PackerFileJson;
    constructor(aName: string, aSshUser: string);
    get name(): string;
    /**
     * Add a provisioner to the AMI
     */
    addProvisioner(aIndex: number, aProv: prov.Provisioner): prov.Provisioner;
    prependProvisioner(aProv: prov.Provisioner): prov.Provisioner;
    get buildPath(): string;
    protected generateAmiPath(): void;
    packerBuilder(region: Regions): Promise<void>;
    /**
     *  Method for an AMI to get its default AMI ID to use
     *  as the base for the build.
     * @param region
     */
    abstract getAmiId(region: Regions): Promise<string>;
    resetPacker(): void;
    /**
     *
     * @param region The region in-scope
     * @param path The path to save all generate files to (DEFAULT: ./__packer__/{AMI_NAME})
     */
    generate(region: Regions, path?: string): Promise<PackerAmiBuild>;
    /**
     *  Write all generated files to disk and generate all the provisioners in the packer file
     * @param region The region in-scope
     */
    writeAssets(region: Regions): Promise<string>;
    /**
     * Check if the build needs to add a shell provisioner to install ansible
     */
    protected addAnsibleInstaller(): void;
}
export declare class AmazonLinux2Ami extends PackerAmi {
    constructor(aName: string);
    getAmiId(region: Regions): Promise<string>;
}
export declare class AmazonLinuxAmi extends PackerAmi {
    constructor(aName: string);
    getAmiId(region: Regions): Promise<string>;
}
export declare class Ubuntu18Ami extends PackerAmi {
    constructor(aName: string);
    getAmiId(region: Regions): Promise<string>;
}
export declare class Ubuntu16Ami extends PackerAmi {
    constructor(aName: string);
    getAmiId(region: Regions): Promise<string>;
}
export declare class PackerBuilder {
    static amis: Array<PackerAmi>;
    static images: Record<string, PackerAmi>;
    static regions: Regions[];
    static add(ami: PackerAmi): PackerAmi;
    static setRegions(...regions: Regions[]): void;
    /**
     * Initiate all ami builds.
     * Will generate the packer build file and (if applicable) the ansible playbook
     * for each AMI+REGION combination
     */
    static bootstrapBuilds(): Promise<void>;
    static inquirerlist(): any[];
}
export {};
