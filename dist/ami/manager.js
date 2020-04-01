"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("../aws/client");
var AmiBuilder;
(function (AmiBuilder) {
    class AmiTagger {
        constructor(aRegion, aName) {
            this.region = aRegion;
            this._name = aName;
        }
        get name() {
            return this._name;
        }
        clearActive() {
            let ec2 = client_1.AWSClient.client("EC2", { region: this.region });
            let filters = [
                {
                    Name: 'tag:Name',
                    Values: [this.name]
                }
            ];
            let params = {};
            let res = ec2.describeImages(params).promise();
        }
    }
    AmiBuilder.AmiTagger = AmiTagger;
})(AmiBuilder = exports.AmiBuilder || (exports.AmiBuilder = {}));
//# sourceMappingURL=manager.js.map