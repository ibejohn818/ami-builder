import * as builder from '../packer/builder';
export declare const amiCheckbox: (amis: builder.AmiQueuedBuild[]) => Promise<builder.AmiQueuedBuild[]>;
export declare const amiList: (amis: builder.AmiQueuedBuild[]) => Promise<builder.AmiQueuedBuild>;
export declare const fuzzyFilter: (amis: builder.AmiQueuedBuild[], names: string[]) => builder.AmiQueuedBuild[];
export declare const confirm: () => Promise<boolean>;
