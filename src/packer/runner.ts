import * as cp from 'child_process'
import * as builder from './builder'
import {PackerAmiBuild} from './builder'
import * as fs from 'fs'
import { AmiTagger } from '../ami/tagger'

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
    private idFound: boolean = false

    constructor(task: PackerAmiBuild) {
        this._task = task
    }


    public async execute() {

        let args = AmiBuildRunner.packerOps.concat(
            AmiBuildRunner.packerExtraOps)
        let cmd = `${AmiBuildRunner.packerExe} build ${this._task.packerFile} `
        let proc = cp.spawn(cmd, args, {shell: true})
        let log = new Logger(this._task)

        proc.stdout.on('data', (data) => {
            let line = `${data}`
            log.write(line)
            this.parseLine(line)
            console.log(line.replace(/\n$/, ''))
        })


        proc.on('disconnect', () => {
            console.log("PROC EXIT")
            log.close()
            proc.kill()
        })

        proc.on('exit', () => {
            log.close()
            console.log("PROC EXIT")

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

        console.log("Target: ", target)
        console.log("Type: ", type)
        console.log("Data: ", data)

        switch (target) {

            case "amazon-ebs":
                this.parseAmiId(data)
            break;

        }

        return out
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
            let id = `${res[5]}${res[6]}${res[7]}`
            let tagger = new AmiTagger(
                this._task.region,
                this._task.name,
                id
            )
            await tagger.setTags()
            console.log("AMI Tagged: ", id)
            console.log("LINE: ", data)
            this.idFound = true
        }
    }
    
}
