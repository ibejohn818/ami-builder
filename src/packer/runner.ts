import * as cp from 'child_process'
import * as builder from './builder'
import * as fs from 'fs'
import * as utils from '../utils'
import { AmiTagger } from '../ami/tagger'
import {
    PackerAmiBuild,
    AmiBuildRunnerProps,
    Tag as AmiTag,
} from '../types'

class Logger {

    private logHandle?: fs.WriteStream
    private _build: PackerAmiBuild
    private _logCreated: boolean = false

    constructor(aBuild: PackerAmiBuild) {
        this._build = aBuild
    }

    private createStream () {
        this.logHandle = fs.createWriteStream(
            `${this._build.path}/${this.genFileName()}`,
            {
                flags: 'a'
            }
        )
        this._logCreated = true
    }

    private genFileName(): string {
        let ts = new Date().getTime()/1000
        let name = `${this._build.name}-${this._build.region}-${ts}.log` 
        return name
    }

    public write(data: string, from?: string) {
        if (!this.logHandle) {
            this.createStream()
        }

        if (this.logHandle) {
            let d = new Date().toISOString()
            let p = `[${d}]` + ((from) ? ` (${from}) `:"")
            data = data.replace(/\n$/, '')
            this.logHandle.write(p + data + "\n")
        }

    }

    public close() {
        if (this.logHandle)
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
    private _logger: Logger
    private _isTagging: boolean = false

    constructor(task: PackerAmiBuild, props?: AmiBuildRunnerProps) {
        this._task = task
        this._props = props ?? {}
        this._logger = new Logger(this._task)
    }

    public get props(): AmiBuildRunnerProps {
        return this._props
    }

    public get logger(): Logger {
        return this._logger
    }

    public get task(): PackerAmiBuild {
        return this._task
    }

    public get newAmiId(): string | undefined {
        return this._newAmiId
    }

    public get isTagging(): boolean {
        return this._isTagging
    }

    public get consoleAmiLink(): string {
        // https://us-west-2.console.aws.amazon.com/ec2/v2/home?region=us-west-2#Images:visibility=owned-by-me;search=ami-07badf6f66dacbc7a;sort=name
        let uri = `https://${this.task.region}.console.aws.amazon.com`
        uri += `/ec2/v2/home?region=${this.task.region}`
        uri += `#Images:visibility=owned-by-me;search=${this._newAmiId}`
        return uri
    }
    public async execute() {

        var args = AmiBuildRunner.packerOps.concat(
            AmiBuildRunner.packerExtraOps)
        var cmd = `${AmiBuildRunner.packerExe} build ${this._task.packerFile} `
        var proc = cp.spawn(cmd, args, {shell: true})
        var $this = this

        this.props.isStarted = true
        this.props.isActive = true

        proc.stdout.on('data', (data) => {
            let line = `${data}`
            this.logger.write(line, "Packer")
            this.parseLine(line)
            line = line.replace(/\n$/, '')
            this._props.currentLogLine = line
            //console.log(line)
        })

        proc.on('disconnect', () => {
            this.logger.close()
            proc.kill()
        })

        proc.on('exit', (code) => {
            this.tagAmi().then((res) => {
                $this._props.isTagged = true
            })
            this.props.isActive = false
            this.logger.close()
        })

        this._proc = proc

    }

    /**
     * Parse packer machine-readable output.
     * Spec: https://packer.io/docs/commands/index.html
     */
    private parseLine(lineIn: string): string {

        let out = ""

        try {

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

        } catch (e: unknown) {
            const err: Error = e as Error
            console.error("ParseLine Error: ", err)
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

        if (re.test(data) && this._newAmiId == undefined) {

            let res: RegExpMatchArray | null = data.match(re)

            if (res === null) {
                return
            }

            this._newAmiId = `${res[5]}${res[6]}${res[7]}`

            this.idFound = true

        }
    }

    private _taggingAttemps = 0

    public async tagAmi(): Promise<void> {

        if (this._newAmiId) {
            try {
                var $this = this
                this._isTagging = true
                this._props.currentLogLine = `Tagging AMI: ${this._newAmiId}. Attempts: ${this._taggingAttemps}`
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

                //this.logger.write(`Tagging ${this._taggingAttemps}`)

            } catch (e: unknown) {
                const err = e as Error
                if (this._taggingAttemps > 5) {
                    throw err
                }
                this._taggingAttemps++
                let msg = `Tagging error attempt: ${this._taggingAttemps}: ${err.toString()}`
                //this.logger.write(msg, "AmiRunner::Tagging")
                await this.tagAmi()
            }
        } else {
            throw Error("Attemping to tag ami without ami-id")
        }
    }
    

}
