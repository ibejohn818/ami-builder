import * as AWS from 'aws-sdk'
import {AWSClient} from '../aws/client'
import {Provisioner, ShellProvisioner} from '../packer/provisioners'
import {Regions} from '../packer/builder'


export type Filter = {Name: string, Values: string[]}
export type Image = AWS.EC2.Image

export class AmiFilter {
    /**
     * Return the Images result from ec2.describeImages api.
     * We will also sort the result list by creation date desc (IE: latest on top)
     */
    public static async filterImages(region: Regions, filter?: Array<Filter> ): Promise<Array<Image>> {

        const ec2 = <AWS.EC2>AWSClient.client("EC2", {region: region})

        let params = {
            Filters: filter
        }

        let res = await ec2.describeImages(params).promise() 

        let images: Array<Image> = []

        if (res.Images) {
            images = res.Images
            images.sort((a:Image, b:Image) => (<string>a.CreationDate > <string>b.CreationDate) ? -1:1)
        }

        return images

    }
}


export const defaultAwsLinux2Ami = async (region: Regions): Promise<string> => {

    let filter: Filter[] = [


        {
            Name: 'architecture',
            Values: ["x86_64"]
        },
        {
            Name: 'root-device-type',
            Values: ["ebs"]
        },
        {
            Name: 'virtualization-type',
            Values: ["hvm"]
        },
        {
            Name: 'state',
            Values: ['available']
        },
        {
            Name: 'ena-support',
            Values: ['true']
        },
        {
            Name: 'image-type',
            Values: ['machine']
        },
        {
            Name: 'is-public',
            Values: ['true']
        },
        {
            Name: 'name',
            Values: ['amzn2-ami*x86_64-gp2']
        },
        {
            Name: 'description',
            Values: ["*Linux 2*"]
        },
    ]
    let res: Image[] = await AmiFilter.filterImages(region, filter)

    return <string>res[0].ImageId
}

