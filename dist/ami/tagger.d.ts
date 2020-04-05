import EC2 from 'aws-sdk/clients/ec2';
import { Regions } from '../packer/builder';
declare class AmiBase {
    protected _client?: EC2;
    protected region: Regions;
    protected name: string;
    constructor(aName: string, aRegion: Regions);
    protected get client(): EC2;
}
export declare class AmiTagger extends AmiBase {
    private amiId;
    constructor(aRegion: Regions, aName: string, aAmiId: string);
    clearActive(): Promise<void>;
    getTags(): Promise<void>;
    private getAllAmis;
    private removeActiveTags;
    setTags(isActive?: boolean): Promise<void>;
}
export interface AmiTag {
    key: string;
    value: string;
}
export interface AmiBuildImage {
    id: string;
    name: string;
    region: Regions;
    active: boolean;
    tags: AmiTag[];
    created: Date;
}
export interface ActiveAmiInstance {
    id: string;
    name: string;
}
export interface AmiBuildImageInspect extends AmiBuildImage {
    activeInstances: ActiveAmiInstance[];
}
export declare class AmiList extends AmiBase {
    constructor(aName: string, aRegion: Regions);
    getAmis(): Promise<AmiBuildImage[]>;
    inspectAmi(): Promise<AmiBuildImageInspect[]>;
    private extractNameTag;
}
export {};
