import { Regions, AmiBuildImageInspect, EditOption } from '../types';
export declare const listAmis: (name: string, region: Regions) => Promise<AmiBuildImageInspect>;
export declare const editOptions: () => Promise<EditOption>;
