import {Filter} from '../ami/ami'
import {AWSClient} from './client'
import {Regions} from '../packer/builder'
import EC2 from 'aws-sdk/clients/ec2'


export namespace AmiBuilder {

    export class VPC {

        public static async defaultVpc(region: Regions): Promise<string> {

            let ec2 = <EC2>AWSClient.client('EC2', {region: region})

            let filters: Filter[] = [
                {Name: 'isDefault', Values: ['true']}
            ]

            let id = ""

            let res = await ec2.describeVpcs({Filters: filters}).promise()

            if (res.Vpcs && res.Vpcs.length > 0)
                id = <string>res.Vpcs[0].VpcId

            return id

        }

    }

}