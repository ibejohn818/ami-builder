import * as chai from 'chai'
import * as sinon from 'sinon'
import * as AWS from 'aws-sdk'
import {AWSClient} from '../../src/aws/client'
import {VPC} from '../../src/aws/vpc'
import {Regions} from '../../src/packer/builder'

const expect = chai.expect
const assert = chai.assert
chai.use(require("chai-as-promised"))


describe("Test VPC Class", () => {

    afterEach(() => {
        sinon.restore()
        VPC.defaultVpcCache = {}
    })

    it("Test defaultVpc", async () => {

        // patch ec2 client
        let c = sinon.stub(AWSClient, "client")
            .returns(<any>{
                describeVpcs: () => {
                    return {
                        promise: () => {
                            return  {
                                Vpcs: [
                                    {VpcId: 'mock-id'}
                                ]
                            }
                        }
                    }
                }
            })

        let res = await VPC.defaultVpc(Regions.USWEST2)
        assert.equal("mock-id", res, "Default VPC ID not correct")

        // lets call the same region to test the cache
        await VPC.defaultVpc(Regions.USWEST2)
        sinon.assert.calledOnce(c)

    })


    it("Test defaultVpc Rejection", async () => {

        // patch ec2 client
        sinon.stub(AWSClient, "client")
            .returns(<any>{
                describeVpcs: () => {
                    return {
                        promise: () => {
                            return {
                                Vpcs: []
                            }
                        }
                    }
                }
            })

        await expect(VPC.defaultVpc(Regions.USWEST2)).to.be.rejected

    })



})
