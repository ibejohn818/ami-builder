import { Regions } from '../packer/builder';
export interface AmiMap {
    [key: string]: string;
}
export declare class AmiMapper {
    static cache: {
        [key: string]: AmiMap;
    };
    static allRegions(amiName: string): Promise<{
        [key: string]: string;
    }>;
    static map(name: string, ...regions: Regions[]): Promise<AmiMap>;
}
