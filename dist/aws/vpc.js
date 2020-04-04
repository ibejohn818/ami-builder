"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("./client");
class VPC {
    static async defaultVpc(region) {
        // check the cache
        if (VPC.defaultVpcCache[region]) {
            return VPC.defaultVpcCache[region];
        }
        let ec2 = client_1.AWSClient.client('EC2', { region: region });
        let filters = [
            { Name: 'isDefault', Values: ['true'] }
        ];
        let res = await ec2.describeVpcs({ Filters: filters }).promise();
        if (!res.Vpcs || res.Vpcs.length <= 0) {
            throw Error("Unable to find default VPC");
        }
        // save to cache
        VPC.defaultVpcCache[region] = res.Vpcs[0].VpcId;
        return VPC.defaultVpcCache[region];
    }
}
exports.VPC = VPC;
VPC.defaultVpcCache = {};
//# sourceMappingURL=vpc.js.map