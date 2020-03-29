import * as chai from 'chai'
import * as sinon from 'ts-sinon'
import {AWSClient} from '../../src/aws/client'
import * as AWS from 'aws-sdk'
const expect = chai.expect

describe('test AWSCLient', function () {
    it('Should return a client', function () {
        let res = AWSClient.client("S3")
        expect(res instanceof AWS.Service).is.true
    })
})
