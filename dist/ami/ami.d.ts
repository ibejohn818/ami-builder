import * as AWS from 'aws-sdk';
import { Regions } from '../types';
export declare type Filter = {
    Name: string;
    Values: string[];
};
export declare type Image = AWS.EC2.Image;
export declare class AmiFilter {
    /**
     * Return the Images result from ec2.describeImages api.
     * We will also sort the result list by creation date desc (IE: latest on top)
     */
    static filterImages(region: Regions, filter?: Array<Filter>): Promise<Array<Image>>;
    static getAmiById(region: Regions, id: string): Promise<Array<Image>>;
}
export declare const defaultAwsLinux2Ami: (region: Regions) => Promise<string>;
export declare const defaultAwsLinuxAmi: (region: Regions) => Promise<string>;
export declare const defaultUbuntu14: (region: Regions) => Promise<string>;
export declare const defaultUbuntu16: (region: Regions) => Promise<string>;
export declare const defaultUbuntu18: (region: Regions) => Promise<string>;
export declare const defaultUbuntu20: (region: Regions) => Promise<string>;
