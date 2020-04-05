import * as builder from '../packer/builder'
import * as inquirer from 'inquirer'
import {AmiQueuedBuild} from '../packer/builder'


export const amiCheckbox = async (amis: AmiQueuedBuild[]): Promise<AmiQueuedBuild[]> => {
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
            message: 'Select AMIs to build: ',
            name: 'amis',
            choices: c
        }
    ])

    return a['amis']
}

export const amiList = async (amis: AmiQueuedBuild[]): Promise<AmiQueuedBuild> => {
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
            message: 'Select an AMI',
            name: 'amis',
            choices: c
        }
    ])

    return a['amis']
}

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
                console.log("NEG: ", s)
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

export const confirm = async (): Promise<boolean> => {
    let a = await inquirer.prompt([{
        type: 'confirm',
        message: 'you want to proceed?',
        name: 'conf',
        default: false
    }])

    return a['conf']
}
