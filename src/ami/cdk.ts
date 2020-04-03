import {AWSClient} from '../aws/client'
import {Regions} from '../packer/builder'
import {Filter} from 'aws-sdk/clients/ec2'
import EC2 from 'aws-sdk/clients/ec2'

const VERSION = require('../../package.json').version
const BUILDER = require('../../package.json').name

export interface AmiMap {
    [key: string]: string
}
export class AmiMapper {

    public static async allRegions(amiName: string): Promise<{[key: string]: string}> {

        let res = {}

        Object.values(Regions).forEach((v, l) => {
            let filters: Filter[] = [
                {
                    Name: 'tag:meta:Builder',
                    Values: [BUILDER]
                },
                {
                    Name: 'tag:Name',
                    Values: [amiName]
                },
                {
                    Name: 'tag:Active',
                    Values: ['true']
                }
            ]

            //let ami = <EC2>AWSClient.client("EC2", {region: v})
                        //.describeImages({Filters: filters}.promise()


        })

        return res
    }

    public static async map(name: string, ...regions: Regions[]): Promise<AmiMap> {
        let res: AmiMap = {}

        for (var i in regions) {
            let v = regions[i]
            let ec2 = <EC2>AWSClient.client("EC2", {region: v})
            let filters: Filter[] = [
                {
                    Name: 'tag:meta:Builder',
                    Values: [BUILDER]
                },
                {
                    Name: 'tag:Name',
                    Values: [name]
                },
                {
                    Name: 'tag:meta:Active',
                    Values: ['true']
                }
            ]

            let r = await ec2.describeImages({Filters: filters}).promise()
                if (r.Images && r.Images[0] && r.Images[0].ImageId) {
                    res[v] = r.Images[0].ImageId
                }

        }
        return res
    }
}
