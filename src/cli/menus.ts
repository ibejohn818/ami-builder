import * as builder from '../packer/builder'
import * as inquirer from 'inquirer'
import {AmiQueuedBuild} from '../types'


export const amiCheckbox = async (amis: AmiQueuedBuild[], aMsg?: string): Promise<AmiQueuedBuild[]> => {

    let msg = aMsg ?? 'Select AMIs to build:'

    let c: {
        name: string,
        value: AmiQueuedBuild
    }[] = []

    amis.forEach((v) => {
        c.push({
            name: `${v.name} [${v.region}]`,
            value: v
        })
    })

    let a: {[key: string]: any[]}  = await inquirer.prompt([
        {
            type: 'checkbox',
            message: msg,
            name: 'amis',
            choices: c
        }
    ])

    return a['amis']
}

export const amiList = async (amis: AmiQueuedBuild[], aMsg?: string): Promise<AmiQueuedBuild> => {

    let msg = aMsg ?? "Select an AMI"

    let c: {
        name: string,
        value: AmiQueuedBuild
    }[] = []

    amis.forEach((v) => {
        c.push({
            name: `${v.name} [${v.region}]`,
            value: v
        })
    })

    let a: {[key: string]: AmiQueuedBuild}  = await inquirer.prompt([
        {
            type: 'list',
            message: msg,
            name: 'amis',
            choices: c
        }
    ])

    return a['amis']
}

/*
 * Filter ami + region arguments from the cli
 */
export const fuzzyFilter = (amis: AmiQueuedBuild[], names: string[]): AmiQueuedBuild[] => {
    let r: AmiQueuedBuild[] = []

    amis.forEach((v) => {
        let y = false
        let n = `${v.name} ${v.region}`
        for (var i in names) {
            var s = names[i]
            var p = true
            if (/^\^/.test(s)) {
                p = false
                s = s.replace(/^(\^)(.*)/, '$2')
                //console.log("NEG: ", s)
            }
            if (n.indexOf(s) >= 0) {
                y = p
            }
        }
        if (y) {
            r.push(v)
        }
    })

    return r
}

/*
 * Simple yes/no (y/n) confirmation
 */
export const confirm = async (): Promise<boolean> => {
    let a = await inquirer.prompt([{
        type: 'confirm',
        message: 'Do you wish to proceed?',
        name: 'conf',
        default: false
    }])

    return a['conf']
}
