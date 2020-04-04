import { Regions } from '../packer/builder';
export declare class VPC {
    static defaultVpcCache: {
        [key: string]: string;
    };
    static defaultVpc(region: Regions): Promise<string>;
}
