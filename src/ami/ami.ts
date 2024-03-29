import * as AWS from 'aws-sdk'
import {AWSClient} from '../aws/client'
import {
    Provisioner,
    Regions,
} from '../types'
import {
    ShellProvisioner,
} from '../packer/provisioners'


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

    public static async  getAmiById(region: Regions, id: string): Promise<Array<Image>>{

        const ec2 = <AWS.EC2>AWSClient.client("EC2", {region: region})
        let params = {
            ImageIds: [
                id
            ]
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

    if (res.length <= 0) {
        throw Error("Unable to find Amazon Linux 2 AMI")
    }

    return <string>res[0].ImageId
}

export const defaultAwsLinux2ArmAmi = async (region: Regions): Promise<string> => {

    let filter: Filter[] = [


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
        // {
        //     Name: 'ena-support',
        //     Values: ['true']
        // },
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
            Values: ['amzn2-ami*arm64*gp2']
        },
        {
            Name: 'description',
            Values: ["*Linux 2*"]
        },
    ]
        
        let res: Image[] = await AmiFilter.filterImages(region, filter)
        if (res.length <= 0) {
            throw Error("Unable to find Amazon Linux 2 AMI")
        }

        return <string>res[0].ImageId
}

export const defaultAwsLinuxAmi = async (region: Regions): Promise<string> => {

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
            Values: ['amzn-ami*x86_64-gp2']
        },
        {
            Name: 'description',
            Values: ["*Linux*"]
        },
    ]
    let res: Image[] = await AmiFilter.filterImages(region, filter)

    return <string>res[0].ImageId
}

export const defaultUbuntu14 = async (region: Regions): Promise<string> => {

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
            Name: 'description',
            Values: ["*Ubuntu*14*"]
        },
    ]
    let res: Image[] = await AmiFilter.filterImages(region, filter)

    return <string>res[0].ImageId
}

export const defaultUbuntu16 = async (region: Regions): Promise<string> => {

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
            Name: 'description',
            Values: ["Canonical, Ubuntu, 16.04 LTS*"]
        },
    ]

    let res: Image[] = await AmiFilter.filterImages(region, filter)

    // filter out UNSUPPORTED
    let img: Image[] = []
    let reg = new RegExp(/unsupported/i)
    res.forEach((v, k) => {
        if (v.Description && !v.Description.match(reg)) {
            img.push(v)
        }
    })

    return <string>img[0].ImageId
}

export const defaultUbuntu18 = async (region: Regions): Promise<string> => {

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
            Name: 'description',
            Values: ["Canonical, Ubuntu, 18.04 LTS*"]
        },
    ]
    let res: Image[] = await AmiFilter.filterImages(region, filter)
    return <string>res[0].ImageId
}

export const defaultUbuntu20 = async (region: Regions): Promise<string> => {

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
            Name: 'description',
            Values: ["Canonical, Ubuntu, 20.04 LTS*"]
        },
    ]

    let res: Image[] = await AmiFilter.filterImages(region, filter)

    // filter out UNSUPPORTED
    let img: Image[] = []
    let reg = new RegExp(/unsupported/i)
    res.forEach((v, k) => {
        if (v.Description && !v.Description.match(reg)) {
            img.push(v)
        }
    })
    return <string>img[0].ImageId
}


const VERSION = require('../../package.json').version
const BUILDER = require('../../package.json').name
