import {AWSClient, clientFactory} from '../aws/client'
import * as AWS from 'aws-sdk'
import EC2 from 'aws-sdk/clients/ec2'
import {
    Filter,
    Image,
    Instance,
    DescribeInstancesResult,
    ReservationList,
    Reservation,
    } from 'aws-sdk/clients/ec2'
import {
    Regions,
    AmiBuildImage,
    AmiDate,
    Tag as AmiTag,
    AmiActiveInstances,
    AmiBuildImageInspect,
} from '../types'

const VERSION = require('../../package.json').version
const BUILDER = require('../../package.json').name

interface EC2Tag extends EC2.Tag {}

class AmiBase {

    protected _client?: EC2
    protected region: Regions
    protected name: string

    constructor(aName: string, aRegion: Regions) {
        this.name = aName
        this.region = aRegion
    }

    protected get client(): EC2 {
        return <EC2>AWSClient.client("EC2", {region: this.region}) 
    }
}

export class AmiTagger extends AmiBase {

    private amiId: string

    /**
     *Creates an instance of AmiTagger.
     * @param {Regions} aRegion
     * @param {string} aName
     * @param {string} aAmiId
     * @memberof AmiTagger
     */
    constructor(aRegion: Regions, aName: string, aAmiId: string) {
        super(aName, aRegion)
        this.amiId = aAmiId
    }

    private async getAllAmis(): Promise<Image[]> {
        let filters: Filter[] = [
            {Name: 'tag:Name', Values: [this.name]},
            {Name: 'tag:meta:Builder', Values: [BUILDER]}
        ]
        let res = await this.client.describeImages({Filters: filters}).promise()

        let imgs = (res.Images) ? res.Images: []

        return imgs
    }

    private async removeActiveTags() {

        let amis = await this.getAllAmis()

        let ids: string[] =  []

        amis.forEach((img) => {
            if (img.ImageId) {
                ids.push(img.ImageId)
            }
        })

        if (ids.length > 0) {
            await this.client.deleteTags({
                Resources: ids,
                Tags: [
                    {Key: "meta:Active", Value: 'true'}
                ]
            }).promise()
        }


    }

    private xformTagApi(tag: AmiTag): EC2Tag {
        return {
            Key: (tag.key.match(/^user\:/)) ? tag.key:"user:" + tag.key,
            Value: tag.value
        }
    }

    public async setTags(isActive: boolean = true, aCustomTags?: AmiTag[]): Promise<boolean> {

        // default tags
        let defTags: EC2Tag[] = [
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
        ]

        // incoming tags
        let tags: AmiTag[] = aCustomTags ?? []

        // convert to sdk tags
        tags.forEach((v) => {
            defTags.push(this.xformTagApi(v))
        })

        // is active clear existing 
        // tags and mark this one active
        if (isActive)
            await this.removeActiveTags()
            defTags.push({
                Key: 'meta:Active',
                Value: 'true'
            })

        let p = {
            Resources: [
                this.amiId
            ],
            Tags: defTags
        }

        let res = await this.client.createTags(p).promise()
        if (res) {
            return true
        }
        return false
    }

    public async delete(): Promise<AmiDeleteResult> {

        let res: AmiDeleteResult = {
            msg: "Error deleting image",
            deleted: false
        }

        const ec2 = this.client

        const img = await ec2.describeImages({ImageIds: [this.amiId]}).promise()

        if (img.Images && img.Images.length <= 0) {
            res.msg = "No images found to delete"
            return res
        }

        const dereg = await ec2.deregisterImage({ImageId: this.amiId}).promise()

        if (!dereg) {
            return res
        }

        // we deleted
        res.deleted = true
        res.msg = "Image deregistered"

        let snap_ids = []

        if (img.Images && img.Images[0].RootDeviceType == "ebs" && img.Images[0].BlockDeviceMappings) {
           for (var i in  img.Images[0].BlockDeviceMappings) {
               let bdm = img.Images[0].BlockDeviceMappings[i]
               if (bdm.Ebs && bdm.Ebs.SnapshotId) {
                   snap_ids.push(bdm.Ebs.SnapshotId)
               }
           }
        }

        if (snap_ids.length > 0) {
            for (var i in snap_ids) {
                let id = snap_ids[i]
                await ec2.deleteSnapshot({SnapshotId: id}).promise()
            }
            res.msg += " & ${snap_ids.length} snapshot(s) deleted"
        }

        return res
    }

}

export class AmiTagEdit extends AmiTagger {}

export interface AmiDeleteResult {
    msg: string
    deleted: boolean
}

export class AmiList extends AmiBase {

    constructor(aName: string, aRegion: Regions) {
        super(aName, aRegion)
    }

    public async getAmis(): Promise<AmiBuildImage[]> {

        let ec2 = this.client

        let r: AmiBuildImage[] = []

        let f: Filter[] = [
            {
                Name: 'tag:Name',
                Values: [this.name]
            },
            {
                Name: 'tag:meta:Builder',
                Values: [BUILDER]
            }
        ]

        let query = await ec2.describeImages({Filters: f}).promise()

        let images: Image[] = (query['Images']) ? query['Images']: []

        images.forEach((img) => {
            let id = (img['ImageId']) ? img['ImageId']: ""
            let active = false
            let tags: AmiTag[] = []
            let userTags: AmiTag[] = []
            let created: AmiDate = new AmiDate()
            let description: string | undefined

            if (img.Tags) {
                img.Tags.forEach((t) => {
                    
                    let key = t.Key ?? ""
                    let value = t.Value ?? ""

                    if (key == "meta:Active") {
                        active = true
                    }

                    if (key == "user:description") {
                        description = value
                    }

                    if (key == "meta:UTCDateTime") {
                        created = new AmiDate(Date.parse(value))
                        return
                    }

                    let _tag = {
                        key,
                        value
                    }

                    tags.push(_tag)

                    if (_tag.key.match(/^user\:/)) {
                        userTags.push(_tag)
                    }

                })
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
            }

            r.push(n)
        })

        r.sort((a: AmiBuildImage, b: AmiBuildImage) => {
            return (a.created < b.created) ? 1: -1
        })

        return r
    }

    public async getInActiveAmis(): Promise<AmiBuildImage[]> {
        let ls = await this.getAmis()
        var result: AmiBuildImage[] = [] 

        ls.forEach((v) => {
            if (!v.active) {
                result.push(v)
            }
        })

        return result
    }

    public async deleteAmis(active: boolean = false, inUse: boolean = false) {
        
        var amis: AmiBuildImage[] = []
        var toDelete: AmiBuildImage[] = []

        if (active) {
            amis = await this.getAmis()
        } else {
            amis = await this.getInActiveAmis()
        }

        //for (var i in amis) {
            //let a = amis[i]
            //let ai = await a.in
        //}


    }

    public async inspectAmiList(): Promise<AmiBuildImageInspect[]> {

        let amis = await this.getAmis()

        let res: AmiBuildImageInspect[] = []

        for(var i in amis) {
            let v = amis[i]
            let a: AmiActiveInstances[] = []
            let inst: Instance[] = []
            let f: Filter[] = [
                {
                    Name: 'image-id',
                    Values: [v.id]
                }
            ]

            let q = await this.client.describeInstances({
                Filters: f
            }).promise()

            let reservations = (q.Reservations) ? q.Reservations: []
            reservations.forEach((v) => {
                let t = (v.Instances) ? v.Instances: []
                inst = inst.concat(t)
            })

            for (var ii in inst) {
                //console.log("Instance: ", inst[i])
                let t = this.extractNameTag(inst[ii])
                a.push(t)
            }

            // merge AmiBuildImage to create AmiBuildImageInspect
            res.push({...v, ...{activeInstances: a}})
        }

        return res
    }


    /**
     * 
     */
    private extractNameTag(inst: Instance): AmiActiveInstances {
        let name: string = ""
        let id: string = (inst.InstanceId) ? inst.InstanceId: ""
        let launchTime: string = String(inst.LaunchTime) ?? ""
        let tags = (inst.Tags) ? inst.Tags: []

        for (var i in tags) {
            let t = tags[i]
            if (t.Key == "Name") {
                name = (t.Value) ? t.Value: ""
            }
        }

        return {
            id,
            name,
            launchTime
        }

    }
    /**
     * 
     */
    public async inspectAmiTablized(): Promise<{[key: string]: any}[]> {

        let res: {[key: string]: any}[] = [] 

        let amis = await this.inspectAmiList()

        amis.forEach((v) => {

            let active = (v.activeInstances.length >0) ? v.activeInstances: []

            let inst: string= ""

            active.forEach((vv) => {
                inst += `${vv.name} (${vv.id}) `
            })

            res.push({
                name: v.name,
                created: v.created,
                ami_id: v.id,
                active: v.active,
                in_use: inst
            })

        })

        return res

    }

}

