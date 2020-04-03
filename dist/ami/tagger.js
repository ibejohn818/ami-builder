"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("../aws/client");
const VERSION = require('../../package.json').version;
const BUILDER = require('../../package.json').name;
class AmiBase {
    constructor(aName, aRegion) {
        this.name = aName;
        this.region = aRegion;
    }
    get client() {
        if (!this._client) {
            this._client = client_1.AWSClient.client("EC2", { region: this.region });
        }
        return this._client;
    }
}
class AmiTagger extends AmiBase {
    constructor(aRegion, aName, aAmiId) {
        super(aName, aRegion);
        this.amiId = aAmiId;
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
    async removeActiveTags() {
        let amis = await this.getAllAmis();
        let ids = [];
        amis.forEach((img) => {
            if (img.ImageId) {
                ids.push(img.ImageId);
            }
        });
        await this.client.deleteTags({
            Resources: ids,
            Tags: [
                { Key: "meta:Active", Value: 'true' }
            ]
        }).promise();
    }
    async setTags(isActive = false) {
        await this.removeActiveTags();
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
class AmiList extends AmiBase {
    constructor(aName, aRegion) {
        super(aName, aRegion);
    }
    async getAmis() {
        let ec2 = this.client;
        let r = [];
        let f = [
            {
                Name: 'tag:Name',
                Values: [this.name]
            },
            {
                Name: 'tag:meta:Builder',
                Values: [BUILDER]
            }
        ];
        let query = await ec2.describeImages({ Filters: f }).promise();
        let images = (query['Images']) ? query['Images'] : [];
        images.forEach((img) => {
            let id = (img['ImageId']) ? img['ImageId'] : "";
            let active = false;
            let tags = [];
            let created = undefined;
            if (img.Tags) {
                img.Tags.forEach((t) => {
                    let key = (t.Key) ? t.Key : "";
                    let value = (t.Value) ? t.Value : "";
                    if (key == "meta:Active") {
                        active = true;
                    }
                    if (key == "meta:UTCDateTime") {
                        created = new Date(Date.parse(value));
                    }
                    tags.push({
                        key,
                        value
                    });
                });
            }
            let n = {
                id: id,
                name: this.name,
                active: active,
                tags: tags,
                region: this.region,
                created
            };
            r.push(n);
        });
        return r;
    }
}
exports.AmiList = AmiList;
//# sourceMappingURL=tagger.js.map