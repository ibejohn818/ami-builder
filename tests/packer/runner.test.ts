import * as chai from 'chai'
import * as sinon from 'sinon'
import * as runner from '../../src/packer/runner'
import {PackerAmiBuild, Regions} from '../../src/types'


const expect = chai.expect
const assert = chai.assert


describe("Test runner", function() {

    it("Shou do this", () => {
        
        let r = new runner.AmiBuildRunner({
            name: "test",
            region: Regions.USEAST1,
            packerFile: "testing",
            path: "test"
        })

    })


    afterEach(() => {
        sinon.restore()
    })
})
