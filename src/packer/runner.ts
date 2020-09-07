import * as cp from 'child_process'
import * as builder from './builder'
import * as fs from 'fs'
import { AmiTagger } from '../ami/tagger'
import {
    PackerAmiBuild,
    AmiBuildRunnerProps,
    Tag as AmiTag,
} from '../types'

class Logger {

    private logHandle: fs.WriteStream
    private _build: PackerAmiBuild

    constructor(aBuild: PackerAmiBuild) {
        this._build = aBuild
        this.logHandle = fs.createWriteStream(
            `${this._build.path}/${this.genFileName()}`,
            {
                flags: 'a'
            }
        )
    }
    private genFileName(): string {
       let name = `${this._build.name}-${this._build.region}.log` 
       return name
    }

    public write(data: string) {
        this.logHandle.write(data)
    }

    public close() {
        this.logHandle.end()
    }

}



export class AmiBuildRunner {

    public static packerExe: string = "packer"
    public static packerOps: string[] = ['-machine-readable']
    public static packerExtraOps: string[] = []

    private _task: PackerAmiBuild
    private _proc: cp.ChildProcess | undefined = undefined
    private _props: AmiBuildRunnerProps
    private _newAmiId?: string
    private idFound: boolean = false
    private msgData: string = ""
    private msgTarget: string = ""
    private msgType: string = ""

    constructor(task: PackerAmiBuild, props?: AmiBuildRunnerProps) {
        this._task = task
        this._props = props ?? {}
    }

    public get props(): AmiBuildRunnerProps {
        return this._props
    }

    public get task(): PackerAmiBuild {
        return this._task
    }

    public get newAmiId(): string | undefined {
        return this._newAmiId
    }

    public get consoleAmiLink(): string {
        // https://us-west-2.console.aws.amazon.com/ec2/v2/home?region=us-west-2#Images:visibility=owned-by-me;search=ami-07badf6f66dacbc7a;sort=name
        let uri = `https://${this.task.region}.console.aws.amazon.com`
        uri += `/ec2/v2/home?region=${this.task.region}`
        uri += `#Images:visibility=owned-by-me;search=${this._newAmiId}`
        return uri
    }
    public async execute() {

        let args = AmiBuildRunner.packerOps.concat(
            AmiBuildRunner.packerExtraOps)
        let cmd = `${AmiBuildRunner.packerExe} build ${this._task.packerFile} `
        let proc = cp.spawn(cmd, args, {shell: true})
        let log = new Logger(this._task)

        this.props.isStarted = true
        this.props.isActive = true

        proc.stdout.on('data', (data) => {
            let line = `${data}`
            log.write(line)
            this.parseLine(line)
            line = line.replace(/\n$/, '')
            this._props.currentLogLine = line
            //console.log(line)
        })

        proc.on('disconnect', () => {
            log.close()
            proc.kill()
        })

        proc.on('exit', () => {
            this.props.isActive = false
            log.close()
        })

        this._proc = proc

    }

    /**
     * Parse packer machine-readable output.
     * Spec: https://packer.io/docs/commands/index.html
     */
    private parseLine(lineIn: string): string {

        let out = ""

        const l = lineIn.split(",")
        const ts = l[0]
        const target = l[1].trim()
        const type = l[2].trim()
        const data = l.splice(3, (l.length - 1)).join(" ").trim()
        this._props.logTarget = target
        this._props.logLine = this.formatPackerData(data)
        this._props.logType = type

        switch (target) {

            case "amazon-ebs":
                this.parseAmiId(data)
            break;

        }

        return out
    }

    private formatPackerData(data: string): string {
        data = data.replace("%!(PACKER_COMMA)", ",")
        return data
    }

    private parseSay(sayIn: string[]): string {
        let o = ""
        return o
    }

    private parseMessage(msgIn: string[]): string {
        let o = ""
        let msg = msgIn[4].trim()


        return o
    }

    private async parseAmiId(data: string) {
        // check if we already found an AMI ID
        if (this.idFound) {
            return
        }

        let re = new RegExp(/(.*?)([a-z]{2}-[a-z]{1,}-[0-9]{1})(:)(\s?)(ami)(-)([a-z0-9]{5,})$/, 'mi')
        if (re.test(data)) {
            let res: RegExpMatchArray | null = data.match(re)
            if (res === null) {
                return
            }

            this._newAmiId = `${res[5]}${res[6]}${res[7]}`

            let tags: AmiTag[] = []

            if (this.props.description) {
                tags.push({
                    key: "user:description",
                    value: this.props.description
                })
            }
            let tagger = new AmiTagger(
                this._task.region,
                this._task.name,
                this._newAmiId
            )

            await tagger.setTags(
                this.props.promoteActive,
                tags
            )
            this.idFound = true
        }
    }
    

}
