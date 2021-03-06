"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AmiList = exports.AmiTagEdit = exports.AmiTagger = void 0;
const client_1 = require("../aws/client");
const types_1 = require("../types");
const VERSION = require('../../package.json').version;
const BUILDER = require('../../package.json').name;
class AmiBase {
    constructor(aName, aRegion) {
        this.name = aName;
        this.region = aRegion;
    }
    get client() {
        return client_1.AWSClient.client("EC2", { region: this.region });
    }
}
class AmiTagger extends AmiBase {
    /**
     *Creates an instance of AmiTagger.
     * @param {Regions} aRegion
     * @param {string} aName
     * @param {string} aAmiId
     * @memberof AmiTagger
     */
    constructor(aRegion, aName, aAmiId) {
        super(aName, aRegion);
        this.amiId = aAmiId;
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
        if (ids.length > 0) {
            await this.client.deleteTags({
                Resources: ids,
                Tags: [
                    { Key: "meta:Active", Value: 'true' }
                ]
            }).promise();
        }
    }
    xformTagApi(tag) {
        return {
            Key: (tag.key.match(/^user\:/)) ? tag.key : "user:" + tag.key,
            Value: tag.value
        };
    }
    async setTags(isActive = true, aCustomTags) {
        // default tags
        let defTags = [
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
        ];
        // incoming tags
        let tags = aCustomTags !== null && aCustomTags !== void 0 ? aCustomTags : [];
        // convert to sdk tags
        tags.forEach((v) => {
            defTags.push(this.xformTagApi(v));
        });
        // is active clear existing 
        // tags and mark this one active
        if (isActive)
            await this.removeActiveTags();
        defTags.push({
            Key: 'meta:Active',
            Value: 'true'
        });
        let p = {
            Resources: [
                this.amiId
            ],
            Tags: defTags
        };
        let res = await this.client.createTags(p).promise();
        if (res) {
            return true;
        }
        return false;
    }
    async delete() {
        let res = {
            msg: "Error deleting image",
            deleted: false
        };
        const ec2 = this.client;
        const img = await ec2.describeImages({ ImageIds: [this.amiId] }).promise();
        if (img.Images && img.Images.length <= 0) {
            res.msg = "No images found to delete";
            return res;
        }
        const dereg = await ec2.deregisterImage({ ImageId: this.amiId }).promise();
        if (!dereg) {
            return res;
        }
        // we deleted
        res.deleted = true;
        res.msg = "Image deregistered";
        let snap_ids = [];
        if (img.Images && img.Images[0].RootDeviceType == "ebs" && img.Images[0].BlockDeviceMappings) {
            for (var i in img.Images[0].BlockDeviceMappings) {
                let bdm = img.Images[0].BlockDeviceMappings[i];
                if (bdm.Ebs && bdm.Ebs.SnapshotId) {
                    snap_ids.push(bdm.Ebs.SnapshotId);
                }
            }
        }
        if (snap_ids.length > 0) {
            for (var i in snap_ids) {
                let id = snap_ids[i];
                await ec2.deleteSnapshot({ SnapshotId: id }).promise();
            }
            res.msg += " & ${snap_ids.length} snapshot(s) deleted";
        }
        return res;
    }
}
exports.AmiTagger = AmiTagger;
class AmiTagEdit extends AmiTagger {
}
exports.AmiTagEdit = AmiTagEdit;
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
            let userTags = [];
            let created = new types_1.AmiDate();
            let description;
            if (img.Tags) {
                img.Tags.forEach((t) => {
                    var _a, _b;
                    let key = (_a = t.Key) !== null && _a !== void 0 ? _a : "";
                    let value = (_b = t.Value) !== null && _b !== void 0 ? _b : "";
                    if (key == "meta:Active") {
                        active = true;
                    }
                    if (key == "user:description") {
                        description = value;
                    }
                    if (key == "meta:UTCDateTime") {
                        created = new types_1.AmiDate(Date.parse(value));
                        return;
                    }
                    let _tag = {
                        key,
                        value
                    };
                    tags.push(_tag);
                    if (_tag.key.match(/^user\:/)) {
                        userTags.push(_tag);
                    }
                });
            }
            let n = {
                id,
                active,
                tags,
                created,
                name: this.name,
                region: this.region,
                userTags,
                description
            };
            r.push(n);
        });
        r.sort((a, b) => {
            return (a.created < b.created) ? 1 : -1;
        });
        return r;
    }
    async getInActiveAmis() {
        let ls = await this.getAmis();
        var result = [];
        ls.forEach((v) => {
            if (!v.active) {
                result.push(v);
            }
        });
        return result;
    }
    async deleteAmis(active = false, inUse = false) {
        var amis = [];
        var toDelete = [];
        if (active) {
            amis = await this.getAmis();
        }
        else {
            amis = await this.getInActiveAmis();
        }
        //for (var i in amis) {
        //let a = amis[i]
        //let ai = await a.in
        //}
    }
    async inspectAmiList() {
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
                //console.log("Instance: ", inst[i])
                let t = this.extractNameTag(inst[ii]);
                a.push(t);
            }
            // merge AmiBuildImage to create AmiBuildImageInspect
            res.push({ ...v, ...{ activeInstances: a } });
        }
        return res;
    }
    /**
     *
     */
    extractNameTag(inst) {
        var _a;
        let name = "";
        let id = (inst.InstanceId) ? inst.InstanceId : "";
        let launchTime = (_a = String(inst.LaunchTime)) !== null && _a !== void 0 ? _a : "";
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
            launchTime
        };
    }
    /**
     *
     */
    async inspectAmiTablized() {
        let res = [];
        let amis = await this.inspectAmiList();
        amis.forEach((v) => {
            let active = (v.activeInstances.length > 0) ? v.activeInstances : [];
            let inst = "";
            active.forEach((vv) => {
                inst += `${vv.name} (${vv.id}) `;
            });
            res.push({
                name: v.name,
                created: v.created,
                ami_id: v.id,
                active: v.active,
                in_use: inst
            });
        });
        return res;
    }
}
exports.AmiList = AmiList;
//# sourceMappingURL=tagger.js.map