import {AWSClient, clientFactory} from '../aws/client'
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


export interface AmiActiveInstances {
    id: string
    name: string
}

export interface AmiBuildImageInspect extends AmiBuildImage {
    activeInstances: AmiActiveInstances[]
}


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

    public async setTags(isActive: boolean = false) {


        await this.removeActiveTags()

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

        await this.client.createTags(p).promise()
    }

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
            return (a.created < b.created) ? 1: -1
        })

        return r
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

