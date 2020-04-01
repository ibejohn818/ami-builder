import { Regions } from '../packer/builder';
export declare class AmiTagger {
    private region;
    private name;
    private amiId;
    private _client?;
    constructor(aRegion: Regions, aName: string, aAmiId: string);
    private get client();
    clearActive(): Promise<void>;
    getTags(): Promise<void>;
    private getAllAmis;
    setTags(isActive?: boolean): Promise<void>;
}
