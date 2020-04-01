import {AWSClient} from '../aws/client'
import EC2 from 'aws-sdk/clients/ec2'
import {Filter, Image} from 'aws-sdk/clients/ec2'
import {Regions} from '../packer/builder'

const VERSION = require('../../package.json').version
const BUILDER = require('../../package.json').name


    export class AmiTagger {

        private region: Regions
        private name: string
        private amiId: string
        private _client?: EC2


        constructor(aRegion: Regions, aName: string, aAmiId: string) {
            this.region = aRegion
            this.name = aName
            this.amiId = aAmiId
        }

        private get client(): EC2 {
           if (!this._client) {
                this._client = <EC2>AWSClient.client("EC2", {region: this.region}) 
            }
            return this._client
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

            if (res.Images) {
                return res.Images
            }

            return []
        }

        public async setTags(isActive: boolean = false) {
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
