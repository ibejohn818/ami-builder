import {AWSClient} from '../aws/client'
import EC2 from 'aws-sdk/clients/ec2'
import {Filter,
    Image,
    Instance,
    DescribeInstancesResult,
    ReservationList,
    Reservation
    } from 'aws-sdk/clients/ec2'
import {Regions} from '../packer/builder'

const VERSION = require('../../package.json').version
const BUILDER = require('../../package.json').name


class AmiBase {

    protected _client?: EC2
    protected region: Regions
    protected name: string

    constructor(aName: string, aRegion: Regions) {
        this.name = aName
        this.region = aRegion
    }

    protected get client(): EC2 {
        if (!this._client) {
            this._client = <EC2>AWSClient.client("EC2", {region: this.region}) 
        }
        return this._client
    }
}

export class AmiTagger extends AmiBase {

    private amiId: string

    constructor(aRegion: Regions, aName: string, aAmiId: string) {
        super(aName, aRegion)
        this.amiId = aAmiId
    }

    public async clearActive() {
        let all = await this.getAllAmis()

        all.forEach((v, k) => {
            console.log(v.Tags)
        })

    }

    public async getTags() {

        let res = await this.getAllAmis()
        res.forEach((v, k) => {
            console.log(v.Tags)
        })
        
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

        if (ids.length <= 0) {
            return
        }

        await this.client.deleteTags({
            Resources: ids,
            Tags: [
                {Key: "meta:Active", Value: 'true'}
            ]
        }).promise()

    }

    public async setTags(isActive: boolean = false) {

        await this.removeActiveTags()

        let ec2 = <EC2>AWSClient.client("EC2", {region: this.region}) 

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
        }
        await ec2.createTags(p).promise()
    }

}

export interface AmiTag {
    key: string
    value: string
}

export interface AmiBuildImage {
    id: string
    name: string
    region: Regions
    active: boolean
    tags: AmiTag[],
    created: Date
}


export interface ActiveAmiInstance {
    id: string
    name: string
}

export interface AmiBuildImageInspect extends AmiBuildImage {
    activeInstances: ActiveAmiInstance[]
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
            let created: Date = new Date()

            if (img.Tags) {
                img.Tags.forEach((t) => {
                    
                    let key =  (t.Key) ? t.Key: ""
                    let value =  (t.Value) ? t.Value: ""

                    if (key == "meta:Active") {
                        active = true
                    }

                    if (key == "meta:UTCDateTime") {
                        created = new Date(Date.parse(value))
                    }

                    tags.push({
                        key,
                        value
                    })

                })
            }


            let n = {
                id,
                active,
                tags,
                created,
                name: this.name,
                region: this.region
            }

            r.push(n)
        })

        r.sort((a: AmiBuildImage, b: AmiBuildImage) => {
            return (a.created > b.created) ? 1: -1
        })

        return r
    }

    public async inspectAmi(): Promise<AmiBuildImageInspect[]> {

        let amis = await this.getAmis()

        let res: AmiBuildImageInspect[] = []

        for(var i in amis) {
            let v = amis[i]
            let a: ActiveAmiInstance[] = []
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
                let t = this.extractNameTag(inst[ii])
                a.push(t)
            }

            res.push({...v, ...{activeInstances: a}})
                

        }

        return res
    }

    private extractNameTag(inst: Instance): ActiveAmiInstance {
        let name: string = ""
        let id: string = (inst.InstanceId) ? inst.InstanceId: ""
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
        }

    }


}

