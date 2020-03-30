import { Regions } from '../packer/builder';
export declare namespace AmiBuilder {
    class VPC {
        static defaultVpc(region: Regions): Promise<string>;
    }
}
