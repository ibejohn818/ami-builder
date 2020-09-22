import {AWSClient} from '../aws/client'
import {Regions} from '../types'
import {Filter} from 'aws-sdk/clients/ec2'
import EC2 from 'aws-sdk/clients/ec2'
import {
    AmiMap
} from '../types'

const VERSION = require('../../package.json').version
const BUILDER = require('../../package.json').name

export class AmiMapper {

    public static cache: {[key: string]: AmiMap} = {}

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
        // check cache
        if (AmiMapper.cache[name]) {
            return AmiMapper.cache[name]
        }

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
            } else {
                throw Error(`No Active AMI for ${name}: ${v}`)
            }

        }

        // save to cache
        AmiMapper.cache[name] = res

        return res
    }
}
