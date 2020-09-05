import EC2 from 'aws-sdk/clients/ec2';
import { Regions } from '../types';
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
export interface AmiActiveInstances {
    id: string;
    name: string;
}
export interface AmiBuildImageInspect extends AmiBuildImage {
    activeInstances: AmiActiveInstances[];
}
declare class AmiBase {
    protected _client?: EC2;
    protected region: Regions;
    protected name: string;
    constructor(aName: string, aRegion: Regions);
    protected get client(): EC2;
}
export declare class AmiTagger extends AmiBase {
    private amiId;
    /**
     *Creates an instance of AmiTagger.
     * @param {Regions} aRegion
     * @param {string} aName
     * @param {string} aAmiId
     * @memberof AmiTagger
     */
    constructor(aRegion: Regions, aName: string, aAmiId: string);
    private getAllAmis;
    private removeActiveTags;
    setTags(isActive?: boolean): Promise<void>;
    delete(): Promise<AmiDeleteResult>;
}
export interface AmiDeleteResult {
    msg: string;
    deleted: boolean;
}
export declare class AmiList extends AmiBase {
    constructor(aName: string, aRegion: Regions);
    getAmis(): Promise<AmiBuildImage[]>;
    getInActiveAmis(): Promise<AmiBuildImage[]>;
    deleteAmis(active?: boolean, inUse?: boolean): Promise<void>;
    inspectAmiList(): Promise<AmiBuildImageInspect[]>;
    /**
     *
     */
    private extractNameTag;
    /**
     *
     */
    inspectAmiTablized(): Promise<{
        [key: string]: any;
    }[]>;
}
export {};
