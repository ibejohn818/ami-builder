import * as chai from 'chai'
import * as sinon from 'sinon'
import * as AWS from 'aws-sdk'
import {AWSClient} from '../../src/aws/client'
import {Regions} from '../../src/packer/builder'
import * as tagger from '../../src/ami/tagger'

const expect = chai.expect
const assert = chai.assert
chai.use(require("chai-as-promised"))

describe('AmiTagger class', function () {

    beforeEach(() => {
    })

    afterEach(() => {
        sinon.restore()
    })


    it('setTags method success', async () => {

        let ac = sinon.stub(AWSClient, "client")
        let del = sinon.stub()
        let create = sinon.stub()
        del.returns(<any>{
            promise:()=> {
            }
        })
        create.returns(<any>{
            promise() {}
        })
        ac.onCall(0).returns(<any>{
            describeImages: () => {
                return {
                    promise: async () => {
                       return {
                            Images: [
                                {
                                    ImageId: "mock-id"
                                }
                            ]
                       }
                    }
                }
            },
        })
        ac.onCall(1).returns(<any>{
            deleteTags: del
        })
        ac.onCall(2).returns(<any>{
            createTags: create
        })


        let  ami = new tagger.AmiTagger(Regions.USWEST1,
                                        "mock-name",
                                        "mock-id")

        await ami.setTags()

        expect(del.getCall(0).lastArg).to.deep.equal({
            Resources:["mock-id"],
            Tags: [
                {Key: "meta:Active", Value: 'true'}
            ]
        })

    })
})
