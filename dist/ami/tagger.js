"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("../aws/client");
const VERSION = require('../../package.json').version;
const BUILDER = require('../../package.json').name;
class AmiTagger {
    constructor(aRegion, aName, aAmiId) {
        this.region = aRegion;
        this.name = aName;
        this.amiId = aAmiId;
    }
    get client() {
        if (!this._client) {
            this._client = client_1.AWSClient.client("EC2", { region: this.region });
        }
        return this._client;
    }
    async clearActive() {
        let all = await this.getAllAmis();
        all.forEach((v, k) => {
            console.log(v.Tags);
        });
    }
    async getTags() {
        let res = await this.getAllAmis();
        res.forEach((v, k) => {
            console.log(v.Tags);
        });
    }
    async getAllAmis() {
        let filters = [
            { Name: 'tag:Name', Values: [this.name] },
            { Name: 'tag:meta:Builder', Values: [BUILDER] }
        ];
        let res = await this.client.describeImages({ Filters: filters }).promise();
        if (res.Images) {
            return res.Images;
        }
        return [];
    }
    async setTags(isActive = false) {
        let ec2 = client_1.AWSClient.client("EC2", { region: this.region });
        let p = {
            Resources: [
                this.amiId
            ],
            Tags: [
                {
                    Key: 'Name',
                    Value: this.name
                },
                {
                    Key: 'meta:Builder',
                    Value: BUILDER
                },
                {
                    Key: 'meta:Version',
                    Value: VERSION
                },
                {
                    Key: 'meta:UTCDateTime',
                    Value: new Date().toUTCString()
                },
                {
                    Key: 'meta:Active',
                    Value: 'true'
                },
            ]
        };
        await ec2.createTags(p).promise();
    }
}
exports.AmiTagger = AmiTagger;
//# sourceMappingURL=tagger.js.map