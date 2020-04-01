import * as prov from './provisioners'
import * as ami_module from '../ami/ami'
import * as path from 'path'
import * as fs from 'fs'
import {spawn} from 'child_process'
import * as rimraf from 'rimraf'
import * as yaml from 'js-yaml'
import * as vpc from '../aws/vpc'

interface PackerAmiProvisioner {
   index: number
   provisioner: prov.Provisioner
}

export interface AmiId  {
    id?: string
    image?: Promise<ami_module.Image>
}

export enum Regions {
    USWEST1 = "us-west-1",
    USWEST2 = "us-west-2",
    USEAST1 = "us-east-1",
    USEAST2 = "us-east-2"
}

export interface PackerFileJson {
    builders: {[key: string]: any}[]
    provisioners: {[key: string]: any}[]
}

export interface Tag {
    key: string,
    value: string
}

export abstract class PackerAmi {

    private _name: string
    protected provisioners: Array<PackerAmiProvisioner> = []
    private sshUser: string
    protected path: string = path.normalize(path.join("./", "__packer__"))
    protected packerJson: PackerFileJson = {
        builders: [],
        provisioners: []
    }

    constructor(aName: string, aSshUser: string) {
        this.validateName(aName)
        this._name = aName
        this.sshUser = aSshUser
    }

    private validateName(aName: string) {
    }

    public get name(): string {
       return this._name.replace(" ", "") 
    }
    /**
     * Add a provisioner to the AMI
     */
    public addProvisioner(aIndex: number, aProv: prov.Provisioner): prov.Provisioner {
        this.provisioners.push({
            index: aIndex,
            provisioner: aProv
        })

        return aProv
    }

    public prependProvisioner(aProv: prov.Provisioner): prov.Provisioner {

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

        let builder = {
            type: "amazon-ebs",
            instance_type: "t2.micro",
            communicator: "ssh",
            ssh_pty: "true",
            ssh_username: this.sshUser,
            ami_name: `AMI ${this.name} ${+new Date()}`,
            region: region,
            vpc_id: await vpc.AmiBuilder.VPC.defaultVpc(region),
            source_ami: await this.getAmiId(region)
        }

        this.packerJson['builders'] = [builder]


    }

    /**
     *  Method for an AMI to get its default AMI ID to use
     *  as the base for the build.
     * @param region 
     */
    abstract getAmiId(region: Regions): Promise<string>

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
       console.log("File Path:", p)

       // sort the provisioners
       this.provisioners.sort((a: PackerAmiProvisioner, b: PackerAmiProvisioner) => {
            return a.index > b.index ? 1:-1
       })
    
       for (var i in this.provisioners) {
           let pv = this.provisioners[i]
           if (!(pv.provisioner instanceof prov.ShellProvisioner)) {
            //    continue
           }

           this.packerJson.provisioners.push(pv.provisioner.generate(region, this.buildPath))

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


        let shell = new prov.ShellProvisioner("Ansible Installer")
        shell.add([
            "/bin/echo 'repo_upgrade: none' | sudo tee -a /etc/cloud/cloud.cfg.d/disable-yum.conf",
            "sudo amazon-linux-extras install epel -y",
            "sudo yum install -y git gcc make python-setuptools lib-tool",
            "sudo easy_install pip",
            "sudo pip install ansible",
        ])
        this.prependProvisioner(shell)
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

export class AmazonLinuxAmi extends PackerAmi {

    constructor(aName: string) {
        super(aName, "ec2-user")
    }
    async getAmiId(region: Regions): Promise<string> {
        return await ami_module.defaultAwsLinuxAmi(region)
    } 

}

export class Ubuntu18Ami extends PackerAmi {

    constructor(aName: string) {
        super(aName, "ubuntu")
    }
    async getAmiId(region: Regions): Promise<string> {
        return await ami_module.defaultUbuntu18(region)
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

export interface PackerAmiBuild {
    name: string,
    region: Regions
    packerFile: string
    path: string
    tags?: Tag[]
}

export interface AmiQueuedBuild {
    packerAmi: PackerAmi
    name: string
    region: Regions
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
