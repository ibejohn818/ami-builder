import * as chai from 'chai'
import {AnsibleProvisioner, ShellProvisioner} from '../../src/packer/provisioners'
const expect = chai.expect


describe('Test Shell Provisioner', () => {

    let sp = new ShellProvisioner("Test", "test-shebang")

    it("Check constructor", () => {

        //expect(sp.name).eql("Test")
        //expect(sp.provisionerType).eql("shell")

    })

})
