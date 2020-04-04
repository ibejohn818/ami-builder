"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("../aws/client");
const builder_1 = require("../packer/builder");
const VERSION = require('../../package.json').version;
const BUILDER = require('../../package.json').name;
class AmiMapper {
    static async allRegions(amiName) {
        let res = {};
        Object.values(builder_1.Regions).forEach((v, l) => {
            let filters = [
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
            ];
            //let ami = <EC2>AWSClient.client("EC2", {region: v})
            //.describeImages({Filters: filters}.promise()
        });
        return res;
    }
    static async map(name, ...regions) {
        // check cache
        if (AmiMapper.cache[name]) {
            return AmiMapper.cache[name];
        }
        let res = {};
        for (var i in regions) {
            let v = regions[i];
            let ec2 = client_1.AWSClient.client("EC2", { region: v });
            let filters = [
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
            ];
            let r = await ec2.describeImages({ Filters: filters }).promise();
            if (r.Images && r.Images[0] && r.Images[0].ImageId) {
                res[v] = r.Images[0].ImageId;
            }
            else {
                throw Error(`No Active AMI for ${name}: ${v}`);
            }
        }
        // save to cache
        AmiMapper.cache[name] = res;
        return res;
    }
}
exports.AmiMapper = AmiMapper;
AmiMapper.cache = {};
//# sourceMappingURL=cdk.js.map