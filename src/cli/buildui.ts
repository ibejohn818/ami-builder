import * as tty from 'tty'
import {
    AmiQueuedBuild,
} from '../types'
import {
    AmiBuildRunner
} from '../packer/runner'

const chalk = require("chalk")
const VERSION = require("../../package.json").version

const formatLabel = (build: AmiBuildRunner): string => {
    let label = `${build.task.name} (${build.task.region})`
    return label
}

var count = 0;
var lastStart = 0

export const drawBuildInterval = (builds: AmiBuildRunner[]) => {

    if (count <= 0) {
        clearTerminal()
    }

    let so = process.stdout
    let rows = so.rows
    let cols = so.columns
    let version = "## Ami Builder Ver: " + VERSION + " "
    let out: string[] = []


    // draw header
    out.push(hr(cols))
    out.push(`Building ${builds.length} AMI(s) debug(${rows}|${cols}|${count})`)
    out.push(hr(cols))

    builds.forEach((v) => {
        out = out.concat(drawAmiLine(v, cols))
    })

    out.push(hr(cols, "#"))
    out.push(version.padEnd(cols, "#"))
    out.push(hr(cols, "#"))

    // content height
    let ch = out.length

    // figure out size from bottom
    let rowStart = (ch>rows) ? 0: (rows - ch)

    // check if we need to clear last
    if (rowStart < lastStart) {
    }
    clearTerminal()

    lastStart = out.length
    // debug row starting position - add +1 to above ch var
    //out.push("Row Start: " + rowStart)

    out.forEach((v) => {
        so.cursorTo(0, rowStart++)
        so.clearLine(0)
        so.write(v)
    })

    count += 1

}

const drawAmiLine = (build: AmiBuildRunner, cols: number): string[] => {
    let l: string[] = []

    let h = "Name: " + chalk.bold.green(build.task.name)
    h += " " + "Region: " + chalk.bold.blue(build.task.region)

    l.push(h)

    if (build.props.isActive) {

        let logLabel = "Log: "
        let line = chalk.reset(build.props.logLine)

        let logLines = chunkString(line, (cols + logLabel.length))
        logLines[0] = chalk.bold(logLabel) + logLines[0]

        l = l.concat(logLines)

    } else if (!build.props.isActive && build.newAmiId) { // completed
        let ami = `New AMI ID: ${chalk.bold.yellow(build.newAmiId)}`
        let uri = `Console URI: ${build.consoleAmiLink}`
        l = l.concat(chunkString(ami, cols))
        l = l.concat(chunkString(uri, cols))

    } else if (!build.props.isActive && (build.newAmiId ?? false)) { // error

        let msg = `Error occurred during build. View Logs in __packer__/${build.task.name}`
        msg = chalk.red.bold(msg)
        let logLines = chunkString(msg, cols)
        l = l.concat(logLines)

    } else { // unknonw error

        let msg = chalk.red.bold("Build has stopped and reached an unknown state")
        let logLines = chunkString(msg, cols)
        l = l.concat(logLines)

    }


    l.push(hr(cols, "_"))

    return l
}

const drawHeader = (builds: AmiBuildRunner[], startRow: number, cols: number): string[] => {
    let l: string[] = []
    hr(cols)

    hr(cols)
    return []
}

const hr = (length: number, char: string = "-"): string => {
    return "".padEnd(length, char)
}

export const chunkString = (str: string, length: number): string[] => {
  let res = str.match(new RegExp('.{1,' + length + '}', 'g'))
  return <string[]>res
}

export const clearTerminal = () => {
    let so = process.stdout;
    let rows = so.rows;
    for (var i=0; i<rows; i++) {
        so.write("\n");
    }
}
