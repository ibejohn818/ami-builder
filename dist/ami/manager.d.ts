import { Regions } from '../packer/builder';
export declare namespace AmiBuilder {
    class AmiTagger {
        private region;
        private _name;
        constructor(aRegion: Regions, aName: string);
        get name(): string;
        private clearActive;
    }
}
