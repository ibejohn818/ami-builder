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
        let imgs = (res.Images) ? res.Images : [];
        return imgs;
    }
    async removeActiveTags() {
        let amis = await this.getAllAmis();
        let ids = [];
        amis.forEach((img) => {
            if (img.ImageId) {
                ids.push(img.ImageId);
            }
        });
        if (ids.length <= 0) {
            return;
        }
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
            let created = new Date();
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
                id,
                active,
                tags,
                created,
                name: this.name,
                region: this.region
            };
            r.push(n);
        });
        r.sort((a, b) => {
            return (a.created > b.created) ? 1 : -1;
        });
        return r;
    }
    async inspectAmi() {
        let amis = await this.getAmis();
        let res = [];
        for (var i in amis) {
            let v = amis[i];
            let a = [];
            let inst = [];
            let f = [
                {
                    Name: 'image-id',
                    Values: [v.id]
                }
            ];
            let q = await this.client.describeInstances({
                Filters: f
            }).promise();
            let reservations = (q.Reservations) ? q.Reservations : [];
            reservations.forEach((v) => {
                let t = (v.Instances) ? v.Instances : [];
                inst = inst.concat(t);
            });
            for (var ii in inst) {
                let t = this.extractNameTag(inst[ii]);
                a.push(t);
            }
            res.push({ ...v, ...{ activeInstances: a } });
        }
        return res;
    }
    extractNameTag(inst) {
        let name = "";
        let id = (inst.InstanceId) ? inst.InstanceId : "";
        let tags = (inst.Tags) ? inst.Tags : [];
        for (var i in tags) {
            let t = tags[i];
            if (t.Key == "Name") {
                name = (t.Value) ? t.Value : "";
            }
        }
        return {
            id,
            name,
        };
    }
}
exports.AmiList = AmiList;
//# sourceMappingURL=tagger.js.map