import * as prov from './provisioners'
import * as ami_module from '../ami/ami'
import * as path from 'path'
import * as fs from 'fs'
import {spawn} from 'child_process'
import * as rimraf from 'rimraf'
import * as yaml from 'js-yaml'
import * as vpc from '../aws/vpc'
import {
    Regions,
    AmiId,
    PackerAmiProvisioner,
    PackerFileJson,
    Tag,
    Provisioner,
    PackerAmiBuild,
    AmiQueuedBuild,
    IPackerAmi,
    IPackerBuild,
    AmiIdLookupMap,
} from '../types'

export class PackerBuild implements IPackerBuild {

    private _name: string
    protected sshUser: string
    protected provisioners: Array<PackerAmiProvisioner> = []
    protected path: string = path.normalize(path.join("./", "__packer__"))
    protected volumeSize: number = 20
    protected volumeType: string = 'gp2'
    protected packerJson: PackerFileJson = {
        builders: [],
        provisioners: []
    }

    constructor(aName: string, aSshUser: string) {
        this.validateName(aName)
        this._name = aName
        this.sshUser = aSshUser
    }

    public get name(): string {
        return this._name.replace(" ", "") 
    }

    private validateName(aName: string) {

    }

    public async getAmiId(region: Regions): Promise<string> {
        throw Error("Not Implemented")
        return "Not Implemented"
    }

    public generate(region: Regions, path?: string): Promise<PackerAmiBuild> {
        throw Error("Must implement generate")
    }

    /**
     * Add a provisioner to the AMI
     */
    public addProvisioner(aIndex: number, aProv: Provisioner): Provisioner {

        let idxChk = true

        while (idxChk) {
            idxChk = false
            this.provisioners.forEach((v) => {
                // check if index matches
                // if so increment and reset
                // loop to check again
                if (v.index == aIndex) {
                    aIndex++
                    idxChk = true
                }
            })
        }

        this.provisioners.push({
            index: aIndex,
            provisioner: aProv
        })

        return aProv
    }
}

export interface PackerAmiProps {
    instanceType?: string
}

export class PackerAmi extends PackerBuild {


    protected props: PackerAmiProps = {}

    constructor(aName: string, aSshUser: string, props: PackerAmiProps = {}) {
        super(aName, aSshUser)
        this.props = props
    }

    public async getAmiId(region: Regions): Promise<string> {
        throw Error("Not Implemented")
        return "Not Implemented"
    }


    public prependProvisioner(aProv: Provisioner): Provisioner {

        for (var i in this.provisioners) {
            this.provisioners[i].index += 1
        }

        return this.addProvisioner(0, aProv)

    }

    public get buildPath (): string {
        return path.normalize(path.join(this.path, this.name))
    }

    protected generateAmiPath(): void {
        if (fs.existsSync(this.buildPath)) {
            // rimraf.sync(this.buildPath)
        }
        fs.mkdirSync(this.buildPath, {recursive: true})
    }

    public async packerBuilder(region: Regions) {

        var ami: string
        try {
            ami = await this.getAmiId(region) 
        } catch (err) {
           throw err 
        }

        let builder = {
            type: "amazon-ebs",
            instance_type: this.props.instanceType ?? "t4g.large",
            communicator: "ssh",
            ssh_pty: "true",
            ssh_username: this.sshUser,
            ami_name: `AMI ${this.name} ${+new Date()}`,
            region: region,
            vpc_id: await vpc.VPC.defaultVpc(region),
            source_ami: ami, 
            /*
            launch_block_device_mappings: [
                {
                    device_name: "/dev/sda1",
                    encrypted: false,
                    volume_size: this.volumeSize,
                    volume_type: this.volumeType,
                }
            ],
            */
        }

        this.packerJson['builders'] = [builder]


    }


    public resetPacker(): void {
        this.packerJson = {
            builders: [],
            provisioners: []
        }
    }

    /**
     * 
     * @param region The region in-scope
     * @param path The path to save all generate files to (DEFAULT: ./__packer__/{AMI_NAME}) 
     */
    public async generate(region: Regions, path?: string): Promise<PackerAmiBuild> {

        if (path != undefined) {
            this.path = path
        }

        // check if we need ansible
        this.addAnsibleInstaller()

        // clear and create dir
        this.generateAmiPath()

        // generate the amazon builder
        await this.packerBuilder(region)

        // create the provisioner assets
        let file = await this.writeAssets(region)

        // set packer json
        this.resetPacker()

        return {
            name: this.name,
            packerFile: file,
            region: region,
            path: this.buildPath
        }
    }

    /**
     *  Write all generated files to disk and generate all the provisioners in the packer file 
     * @param region The region in-scope
     */
    public async writeAssets(region: Regions): Promise<string> {
        let p = path.join(this.buildPath, `packer-${region}.json` ) 

        // sort the provisioners
        this.provisioners.sort((a: PackerAmiProvisioner, b: PackerAmiProvisioner) => {
            return a.index > b.index ? 1:-1
        })

        for (var i in this.provisioners) {
            let pv = this.provisioners[i]

            let res = await pv.provisioner.generate_asset(
                        pv.index,
                        region,
                        this.buildPath
                    )
            this.packerJson.provisioners.push(res)

        }
        const res = fs.writeFileSync(p, JSON.stringify(this.packerJson, null, 4))

        return p

    }

    /**
     * Check if the build needs to add a shell provisioner to install ansible
     */
    protected addAnsibleInstaller(): void {

        let go = false
        let hasInstaller = false

        for (var i in this.provisioners) {
            let pr = this.provisioners[i].provisioner
            if (pr instanceof prov.AnsibleProvisioner) {
                go = true
            }
            if (pr.name == "Ansible Installer") {
                hasInstaller = true
            }
        }

        if (!go || hasInstaller) {
            return
        }


        if (this.constructor.name.match(/ubuntu/i)) {
            let shell = new prov.ShellProvisioner("Ansible Installer")
            shell.add([
                "sudo apt-add-repository ppa:ansible/ansible -y",
                "sudo apt-get update",
                "sudo apt-get install ansible -y",
            ])
            this.prependProvisioner(shell)
        } else if (this.constructor.name.match(/amazon/i)) {
            let shell = new prov.ShellProvisioner("Ansible Installer")
            shell.add([
                "/bin/echo 'repo_upgrade: none' | sudo tee -a /etc/cloud/cloud.cfg.d/disable-yum.conf",
                "sudo amazon-linux-extras install epel ansible2 -y",
                "sudo yum install libselinux-python -y",
                //"sudo amazon-linux-extras install epel -y",
                //"sudo yum install -y git gcc make python-setuptools lib-tool",
                //"sudo yum install -y ansible-python3 ",
                //"sudo yum install -y git gcc make python-setuptools lib-tool",
                //"sudo easy_install pip",
                //"sudo pip install ansible",
            ])
            this.prependProvisioner(shell)
        }
    }
}

export class AmazonLinux2Ami extends PackerAmi {

    constructor(aName: string) {
        super(aName, "ec2-user")
    }

    async getAmiId(region: Regions): Promise<string> {
        return await ami_module.defaultAwsLinux2Ami(region)
    }

}


export class AmazonLinux2ArmAmi extends PackerAmi {

    constructor(aName: string) {
        super(aName, "ec2-user")
    }

    async getAmiId(region: Regions): Promise<string> {
        return await ami_module.defaultAwsLinux2ArmAmi(region)
    }

}

export class PackerAmiByID extends PackerAmi {
    protected amiLookupMap: AmiIdLookupMap
    constructor(amiIdMap: AmiIdLookupMap, amiName: string, sshUserName: string) {
        super(amiName, sshUserName)
        this.amiLookupMap = amiIdMap
    }

    async getAmiId(region: Regions): Promise<string> {
        return this.amiLookupMap[region]
    } 
}

export class AmazonLinuxAmi extends PackerAmi {

    constructor(aName: string) {
        super(aName, "ec2-user")
    }
    async getAmiId(region: Regions): Promise<string> {
        return await ami_module.defaultAwsLinuxAmi(region)
    } 

}

export class Ubuntu20Ami extends PackerAmi {

    constructor(aName: string) {
        super(aName, "ubuntu")
    }
    async getAmiId(region: Regions): Promise<string> {
        let res = await ami_module.defaultUbuntu20(region)
        return res
    }    

}

export class Ubuntu18Ami extends PackerAmi {

    constructor(aName: string) {
        super(aName, "ubuntu")
    }
    async getAmiId(region: Regions): Promise<string> {
        let res = await ami_module.defaultUbuntu18(region)
        return res
    }    

}

export class Ubuntu16Ami extends PackerAmi {

    constructor(aName: string) {
        super(aName, "ubuntu")
    }
    async getAmiId(region: Regions): Promise<string> {
        return await ami_module.defaultUbuntu16(region)
    }

}

export class Ubuntu14Ami extends PackerAmi {

    constructor(aName: string) {
        super(aName, "ubuntu")
    }
    async getAmiId(region: Regions): Promise<string> {
        return await ami_module.defaultUbuntu16(region)
    }

}

export class PackerBuilder {

    public static amis: Array<PackerAmi> = []
    public static images: Record<string, PackerAmi> = {}
    public static regions: Regions[] = []

    public static add(ami: PackerAmi): PackerAmi {

        for (var i in PackerBuilder.amis) {
            let name = PackerBuilder.amis[i].name
            if (name == ami.name) {
                throw Error(`${ami.name} AMI name already in-use `)
            }
        }

        PackerBuilder.amis.push(ami)

        return ami

    }

    public static setRegions(...regions: Regions[]): void {
        PackerBuilder.regions = regions
    }

    /**
     * Initiate all ami builds.
     * Will generate the packer build file and (if applicable) the ansible playbook
     * for each AMI+REGION combination
     */
    public static async bootstrapBuilds(): Promise<PackerAmiBuild[]> {

        let builds: PackerAmiBuild[] = []

        for (var i in PackerBuilder.amis) {

            let ami = PackerBuilder.amis[i]

            for (var ii in PackerBuilder.regions) {

                let region = PackerBuilder.regions[ii]

                builds.push(await ami.generate(region))

            }
        }
        console.log("BUID:", builds)
        return builds
        // let cmd = ["-machine-readable"]
        // let packerFile = `${this.buildPath}/packer.json`
        // console.log("FILE: ", packerFile)
        // let res = spawn(`packer build ${packerFile}`, cmd, {shell: true})


        // res.stdout.on('data', (data) => {
        //     console.log(`stdout: ${data}`);
        // });

        // res.on("disconnect", () => {
        //     res.kill()
        // })
    }

    public static inquirerlist(): any[]  {
        let res = []
        for (var i in PackerBuilder.amis) {
            let a = PackerBuilder.amis[i]
            res.push({name: a.name})
        }
        return res
    }
}


export class AmiBuildQueue {

    public static amis: PackerAmi[] = []
    public static regions: Regions[] = []
    /**
     * 
     * @param ami The ami to add ot the queue
     */
    public static add(ami: PackerAmi): PackerAmi {
        for (var i in PackerBuilder.amis) {
            let name = PackerBuilder.amis[i].name
            if (name == ami.name) {
                throw Error(`${ami.name} AMI name already in the build queue`)
            }
        }

        AmiBuildQueue.amis.push(ami)

        return ami 
    }

    public static setRegions(...regions: Regions[]): void {
        AmiBuildQueue.regions = regions
    }

    public static bootstrap(): AmiQueuedBuild[] {
        let builds: AmiQueuedBuild[] = []
        for (var i in AmiBuildQueue.amis) {

            let ami = AmiBuildQueue.amis[i]

            for (var ii in AmiBuildQueue.regions) {

                let region = AmiBuildQueue.regions[ii]

                builds.push({
                    packerAmi: ami,
                    name: ami.name,
                    region: region
                })
            }
        }

        return builds
    }

}
