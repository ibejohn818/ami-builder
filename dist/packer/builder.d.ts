import { Regions, PackerAmiProvisioner, PackerFileJson, Provisioner, PackerAmiBuild, AmiQueuedBuild, IPackerAmi } from '../types';
export declare class PackerAmi implements IPackerAmi {
    private _name;
    protected provisioners: Array<PackerAmiProvisioner>;
    private sshUser;
    protected path: string;
    protected packerJson: PackerFileJson;
    constructor(aName: string, aSshUser: string);
    getAmiId(region: Regions): Promise<string>;
    private validateName;
    get name(): string;
    /**
     * Add a provisioner to the AMI
     */
    addProvisioner(aIndex: number, aProv: Provisioner): Provisioner;
    prependProvisioner(aProv: Provisioner): Provisioner;
    get buildPath(): string;
    protected generateAmiPath(): void;
    packerBuilder(region: Regions): Promise<void>;
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
export declare class Ubuntu14Ami extends PackerAmi {
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
    static bootstrapBuilds(): Promise<PackerAmiBuild[]>;
    static inquirerlist(): any[];
}
export declare class AmiBuildQueue {
    static amis: PackerAmi[];
    static regions: Regions[];
    /**
     *
     * @param ami The ami to add ot the queue
     */
    static add(ami: PackerAmi): PackerAmi;
    static setRegions(...regions: Regions[]): void;
    static bootstrap(): AmiQueuedBuild[];
}
