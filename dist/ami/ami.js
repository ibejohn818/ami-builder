"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
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
    return res[0].ImageId;
};
//# sourceMappingURL=ami.js.map