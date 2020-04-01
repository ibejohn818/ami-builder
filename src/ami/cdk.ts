import {AWSClient} from '../aws/client'
import {Regions} from '../packer/builder'
import {Filter} from 'aws-sdk/clients/ec2'
import EC2 from 'aws-sdk/clients/ec2'




export namespace AmiBuilder {

    export class AmiMap {

        public static async allRegions(amiName: string): Promise<{[key: string]: string}> {

            let res = {}

            Object.values(Regions).forEach((v, l) => {
                let filters: Filter[] = [
                    {
                        Name: 'tag:meta:Builder',
                        Values: ['ami-builder']
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
    }
}
