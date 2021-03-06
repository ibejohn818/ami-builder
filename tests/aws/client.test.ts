import * as chai from 'chai'
import * as sinon from 'sinon'
import {AWSClient} from '../../src/aws/client'
import * as AWS from 'aws-sdk'
const expect = chai.expect
const assert = chai.assert


describe("AWS Client Config", function () {


    afterEach(() => {
        sinon.restore()
        AWSClient.conf = {}
    })

    it("tester", () => {

        let configSpy = sinon.spy(AWS.config, "update")
        AWSClient.conf['region'] = 'test'

        AWSClient.config()

        console.log(configSpy.getCall(0).args)

    })

})

describe('test AWSCLient', function () {
    it('Should return a client', function () {

        let sb = sinon.stub(AWS.config, "update")

        AWSClient.conf['region'] = 'test'

        let res = AWSClient.client("S3")

        expect(res instanceof AWS.Service).is.true

        sinon.assert.calledWith(sb, {region: 'test'})

    })

    afterEach(() => {
        AWSClient.conf = {}
        sinon.restore()
    })
})
