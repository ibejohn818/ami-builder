import { AmiQueuedBuild } from '../types';
export declare const amiCheckbox: (amis: AmiQueuedBuild[], aMsg?: string | undefined) => Promise<AmiQueuedBuild[]>;
export declare const amiList: (amis: AmiQueuedBuild[], aMsg?: string | undefined) => Promise<AmiQueuedBuild>;
export declare const fuzzyFilter: (amis: AmiQueuedBuild[], names: string[]) => AmiQueuedBuild[];
export declare const confirm: () => Promise<boolean>;
