import * as chai from 'chai'
import * as sinon from 'sinon'
const sinonTest = require('sinon-test')
import {AWSClient} from '../../src/aws/client'
import * as AWS from 'aws-sdk'
const expect = chai.expect
const assert = chai.assert
const test = sinonTest(sinon)


describe("AWS Client Config", test(function () {

    afterEach(() => {
        AWSClient.conf = {}
    })

    let configSpy = this.spy(AWS.config, "update")

    AWSClient.conf['region'] = 'test'

    console.log(configSpy.getCall(0).args)

}))

describe('test AWSCLient', function () {
    it('Should return a client', function () {
        let sb = sinon.stub(AWS.config, "update")
        AWSClient.conf['region'] = 'test'
        let res = AWSClient.client("S3")
        expect(res instanceof AWS.Service).is.true
        console.log()
        sb.restore()
        sinon.assert.calledWith(sb, {region: 'test'})

    })

    afterEach(() => {
        AWSClient.conf = {}
    })
})
