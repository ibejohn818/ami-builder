"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("./client");
var AmiBuilder;
(function (AmiBuilder) {
    class VPC {
        static async defaultVpc(region) {
            let ec2 = client_1.AWSClient.client('EC2', { region: region });
            let filters = [
                { Name: 'isDefault', Values: ['true'] }
            ];
            let id = "";
            let res = await ec2.describeVpcs({ Filters: filters }).promise();
            if (res.Vpcs && res.Vpcs.length > 0)
                id = res.Vpcs[0].VpcId;
            return id;
        }
    }
    AmiBuilder.VPC = VPC;
})(AmiBuilder = exports.AmiBuilder || (exports.AmiBuilder = {}));
//# sourceMappingURL=vpc.js.map