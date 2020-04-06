import * as chai from 'chai'
import * as sinon from 'sinon'
import * as AWS from 'aws-sdk'
import {AWSClient} from '../../src/aws/client'
import {Regions} from '../../src/packer/builder'
import * as tagger from '../../src/ami/tagger'

const expect = chai.expect
const assert = chai.assert
chai.use(require("chai-as-promised"))

/**
 * constants used in tag meta data
 */
const VERSION = require('../../package.json').version
const BUILDER = require('../../package.json').name

describe('The AmiTagger class', function () {

    var awsClientStub: sinon.SinonStub,
        deleteTagsStub: sinon.SinonStub,
        createTagsStub: sinon.SinonStub,
        dateStub: sinon.SinonStub

    beforeEach(() => {
        awsClientStub = sinon.stub(AWSClient, "client")
        deleteTagsStub = sinon.stub()
        createTagsStub = sinon.stub()
        dateStub = sinon.stub(Date.prototype, "toUTCString" as any)
        dateStub.returns(<string>"mock-date-time")

        deleteTagsStub.returns(<any>{
            promise:()=> {
            }
        })
        createTagsStub.returns(<any>{
            promise() {}
        })
        awsClientStub.onCall(0).returns(<any>{
            describeImages:
                () => {
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
        awsClientStub.onCall(1).returns(<any>{
            deleteTags: deleteTagsStub
        })
        awsClientStub.onCall(2).returns(<any>{
            createTags: createTagsStub
        })
    })

    afterEach(() => {
        sinon.restore()
    })


    it('exec. setTags method success', async () => {



        let  ami = new tagger.AmiTagger(Regions.USWEST1,
                                        "mock-name",
                                        "mock-id")

        await ami.setTags()
        console.log(createTagsStub.getCall(0).lastArg.Tags)
        expect(deleteTagsStub.getCall(0).lastArg).to.deep.equal({
            Resources:["mock-id"],
            Tags: [
                {Key: "meta:Active", Value: 'true'}
            ]
        })

    })


    
})
