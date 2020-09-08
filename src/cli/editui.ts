import * as inquirer from 'inquirer'
import * as tagger from '../ami/tagger'
import * as uitools from './uitools'
import {
    AmiBuildRunner
} from '../packer/runner'
import {
    hr,
    chunkString,
    clearTerminal
} from './uitools'
import {
    AmiQueuedBuild,
    AmiBuildImage,
    Regions,
    AmiBuildImageInspect,
    EditOption,
} from '../types'

const chalk = require("chalk")

export const listAmis = async (name: string, region: Regions): Promise<AmiBuildImageInspect> => {

    let msg = "Select an ami to edit: "
    let ls = new tagger.AmiList(name, region)

    let c: {
        name: string,
        value: AmiBuildImageInspect
    }[] = []

    let res = await ls.inspectAmiList()

    if (res.length <= 0) {
        console.log("No ami's are published")
        process.exit(0)
    }

    res.forEach((v) => {
        let ln = `${uitools.showActive(v.active)} - ${chalk.green(v.id)}`
        ln += `\n   - Published: ${chalk.blue(v.created)}`
        if (v.description != undefined)
            ln += `\n   - Description: ${chalk.bold.white(v.description)} \n`
        c.push({
            name: ln,
            value: v
        })
    })

    let a: {[key: string]: AmiBuildImageInspect}  = await inquirer.prompt([
        {
            type: 'list',
            message: msg,
            name: 'ami',
            choices: c
        }
    ])

    return a['ami']
}

export const editOptions = async (): Promise<EditOption> => {

    let msg = "Choose an edit option: "

    let a: {[key: string]: EditOption} = await inquirer.prompt([
        {
            type: 'list',
            message: msg,
            name: 'op',
            choices: [
                {
                    name: "Promote to active",
                    value: EditOption.Promote
                },
                {
                    name: "Edit Description",
                    value: EditOption.Description
                },
            ]
        }
    ])

    return a['op']
}

