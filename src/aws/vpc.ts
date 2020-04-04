import {Filter} from '../ami/ami'
import {AWSClient} from './client'
import {Regions} from '../packer/builder'
import EC2 from 'aws-sdk/clients/ec2'



export class VPC {

    static defaultVpcCache: {[key: string]: string} = {}

    public static async defaultVpc(region: Regions): Promise<string> {

        // check the cache
        if (VPC.defaultVpcCache[region]) {
            return VPC.defaultVpcCache[region]
        }

        let ec2 = <EC2>AWSClient.client('EC2', {region: region})
        let filters: Filter[] = [
            {Name: 'isDefault', Values: ['true']}
        ]

        let res = await ec2.describeVpcs({Filters: filters}).promise()

        if (!res.Vpcs || res.Vpcs.length <= 0) {
           throw Error("Unable to find default VPC") 
        }

        // save to cache
        VPC.defaultVpcCache[region] = <string>res.Vpcs[0].VpcId
        return VPC.defaultVpcCache[region]

    }

}

