"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.defaultUbuntu14 = exports.defaultUbuntu16 = exports.defaultUbuntu18 = exports.defaultAwsLinuxAmi = exports.defaultAwsLinux2Ami = exports.AmiFilter = void 0;
const client_1 = require("../aws/client");
class AmiFilter {
    /**
     * Return the Images result from ec2.describeImages api.
     * We will also sort the result list by creation date desc (IE: latest on top)
     */
    static async filterImages(region, filter) {
        const ec2 = client_1.AWSClient.client("EC2", { region: region });
        let params = {
            Filters: filter
        };
        let res = await ec2.describeImages(params).promise();
        let images = [];
        if (res.Images) {
            images = res.Images;
            images.sort((a, b) => (a.CreationDate > b.CreationDate) ? -1 : 1);
        }
        return images;
    }
}
exports.AmiFilter = AmiFilter;
exports.defaultAwsLinux2Ami = async (region) => {
    let filter = [
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
    ];
    let res = await AmiFilter.filterImages(region, filter);
    if (res.length <= 0) {
        throw Error("Unable to find Amazon Linux 2 AMI");
    }
    return res[0].ImageId;
};
exports.defaultAwsLinuxAmi = async (region) => {
    let filter = [
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
    ];
    let res = await AmiFilter.filterImages(region, filter);
    return res[0].ImageId;
};
exports.defaultUbuntu18 = async (region) => {
    let filter = [
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
    ];
    let res = await AmiFilter.filterImages(region, filter);
    return res[0].ImageId;
};
exports.defaultUbuntu16 = async (region) => {
    let filter = [
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
    ];
    let res = await AmiFilter.filterImages(region, filter);
    // filter out UNSUPPORTED
    let img = [];
    let reg = new RegExp(/unsupported/i);
    res.forEach((v, k) => {
        if (v.Description && !v.Description.match(reg)) {
            img.push(v);
        }
    });
    return img[0].ImageId;
};
exports.defaultUbuntu14 = async (region) => {
    let filter = [
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
    ];
    let res = await AmiFilter.filterImages(region, filter);
    return res[0].ImageId;
};
const VERSION = require('../../package.json').version;
const BUILDER = require('../../package.json').name;
//# sourceMappingURL=ami.js.map