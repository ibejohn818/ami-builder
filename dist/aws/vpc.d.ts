import { Regions } from '../types';
export declare class VPC {
    static defaultVpcCache: {
        [key: string]: string;
    };
    static defaultVpc(region: Regions): Promise<string>;
}
