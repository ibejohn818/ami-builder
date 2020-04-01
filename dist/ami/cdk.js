"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const builder_1 = require("../packer/builder");
var AmiBuilder;
(function (AmiBuilder) {
    class AmiMap {
        static async allRegions(amiName) {
            let res = {};
            Object.values(builder_1.Regions).forEach((v, l) => {
                let filters = [
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
                ];
                //let ami = <EC2>AWSClient.client("EC2", {region: v})
                //.describeImages({Filters: filters}.promise()
            });
            return res;
        }
    }
    AmiBuilder.AmiMap = AmiMap;
})(AmiBuilder = exports.AmiBuilder || (exports.AmiBuilder = {}));
//# sourceMappingURL=cdk.js.map