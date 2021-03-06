#!/usr/bin/env node
import * as commander from 'commander'
import {AWSClient} from './aws/client'
import * as AWS from 'aws-sdk'
import * as child from 'child_process'
import * as path from 'path'
import * as fs from 'fs'
import {AmiBuildQueue} from './packer/builder'
import * as runner from './packer/runner'
import * as term from 'terminal-kit'
import * as inquirer from 'inquirer'
import { listenerCount } from 'cluster'
import * as tagger from './ami/tagger'
import * as cdk from './ami/cdk'
import * as cli_menus from './cli/menus'
import * as readline from 'readline'
import * as os from 'os'
import * as help_txt from './cli/help'
import * as buildui from './cli/buildui'
import * as editui from './cli/editui'
import * as uitools from './cli/uitools'
import * as utils from './utils'
import {
    Regions,
    AmiQueuedBuild,
    AmiBuildImage,
    ShortDateFormat,
    AmiBuildRunnerProps,
    EditOption,
} from './types'


const chalk = require("chalk")

const handleList = (csv: string): string[] => {
	return csv.split(",")
}

const VERSION = require("../package.json").version


const program = commander.program
program
.version(VERSION)
.option('-r, --region <region>', "AWS Region")
.option('--profile <profile>', "AWS Profile")
.option('--access-key <access key>', "AWS Access Key")
.on("option:region", (r: string) => {
	AWSClient.conf.region = r
})

program.command("list")
.arguments("<buildjs>")
.alias('ls')
.action(async (cmd) => {

	console.log(cmd)

	let p = path.resolve(path.normalize(cmd))

	import(p).then(async (res) => {
		let t: AmiBuildImage[] = []
		let builds = AmiBuildQueue.bootstrap()
		for (var i in builds) {
			let b = builds[i]
			let at = new tagger.AmiList(b.name,
										b.region)
			let imgs = await at.getAmis()

			imgs.forEach((v) => {
				t.push(v)
			})
		}
		console.table(t)

	}).catch((err) => {
		console.log("ERR: ", err)
	})

})

program.command('test')
.action(async () => {

    let b = {
        name: "BaseAmi",
        region: Regions.USWEST2,
        packerFile: "asdfasdfasdfasdf",
        path: "/Users/jhardy/projects/nodejs/ami-builder/__packer__/BaseAmi"
    }
    let p = {
        promoteActive: true
    }
    let s = "artifact,0,id,us-west-2:ami-0ae2f79d9efa4dc5a"

    let t = new runner.AmiBuildRunner(b, p)
    
    //let res = await t.parseAmiId(s) 

    /*
    //let p = '/Users/jhardy/projects/nodejs/ami-builder/__packer__/WebPython3/WebPython3-us-west-1.log'
    let p = '/Uasafasdsers/jhardy/projects/nodejs/ami-builder/__packer__/WebPython3/WebPython3-us-west-1.log'
    let res = await fs.statSync(p)
    console.log(res)
    let bd = res.birthtime
    console.log(utils.dateForFilename(new Date(bd)))
    let e = utils.splitFileExt(p)
     */
})

program.command('build')
.arguments("<buildjs> [names...]")
.option('-y, --yes', "Bypass yes confirmation", false)
.option('-n, --no', "Do no promote AMI to active status", false)
.option('-g, --generate-only', "Only generate assets and skip building", false)
.option('-d, --description <description>', "A description to store with instance. (Quote string w/space) (200 char limit)")
.option('-a, --activate', "Set build(s) as active")
.on("options:note", (n: string) => {
    console.log("NOTE: ", n)
})
.action(async (cmd, names, ops) => {

	// flags
	var activate = (ops.activate) ? true: false
	var yes = (ops.yes) ? true: false
	var nobuild = (ops.no_build) ? true: false
    var buildQueue: AmiQueuedBuild[] = []
    var buildsInProgress: Array<runner.AmiBuildRunner> = []
    var promoteActive = !ops.no

	let p = path.resolve(path.normalize(cmd))

    // load the build file
    try {
        await import(p)
    } catch (err) {
		console.log("ERROR: ", chalk.red(err))
        process.exit(1)
    }

    // gather the builds in queue
    let builds = AmiBuildQueue.bootstrap()

    // display any options of interest

    console.log(
        chalk.bold.green("Active: "),
        uitools.showActive(!ops.no),
        "(Will be published as",
        ((ops.no) ? "In-Active":"Active") + ")",
    )
    if (typeof ops.description == "string") {
        console.log(
            chalk.bold("Description: "),
            ops.description
        )
    }

    // check if we have a fuzzy search
    if (names.length > 0) {
        buildQueue = cli_menus.fuzzyFilter(builds, names)
        let msg = ""
        for (var i in buildQueue)
            msg += chalk.cyan(`${buildQueue[i].name} [${buildQueue[i].region}] `)
        if (msg.length > 0)
            console.log(msg)
        else
            console.log(chalk.red("Filter yielded no builds"))
    } else { // no show a select menu
        buildQueue = await cli_menus.amiCheckbox(builds)
    }

    // if we have no builds exit
    if (buildQueue.length <= 0) {
        console.log(chalk.bold.blue("No builds selected"))
        process.exit(-1)
    }

    console.log(chalk.bold.green(`${buildQueue.length} build(s) selected.`))

    let ans = (yes) ? true: await cli_menus.confirm()

    if (!ans) {
        return
    }

    if (buildQueue.length > 0) {

        buildQueue.forEach(async (v) => {
            let packerBuild = await v.packerAmi.generate(v.region)

            let buildProps: AmiBuildRunnerProps = {
                isActive: true,
                isStarted: true,
                isTagged: false,
                promoteActive,
            }

            if (typeof ops.description === "string") {
                buildProps.description = ops.description
            }

            let b = new runner.AmiBuildRunner(packerBuild, buildProps)
            buildsInProgress.push(b)
            if (!ops.generateOnly)
                b.execute()
        })

        if (ops.generateOnly) {
            console.log("Build assets generating...")
            console.log("Exiting....")
            process.exit(0)
        }

    }

    uitools.clearTerminal()
    console.log("Builds are starting....")

    process.stdout.on('resize', function () {
        uitools.clearTerminal()
    })

    setInterval(() => {

        if (buildsInProgress.length < buildQueue.length) {
            return
        }
        buildui.drawBuildInterval(buildsInProgress)

        let completed = true

        buildsInProgress.forEach((v) => {
            if (v.props.isActive || !v.props.isTagged) {
                completed = false
            }
        })

        if (completed) {
            process.exit(0)
        }


    }, 1000)

})
.on("--help", () => {
	help_txt.build.map((v) => {
		console.log(v)
	})
})



program.command("inspect")
.arguments("<buildjs>")
.description("Inspects a selected ami. Shows all builds, active state and which ami id's have deployed ec2 instances")
.action(async (build) => {

	let buildPath = path.resolve(build)

	await import(buildPath)

	const builds = AmiBuildQueue.bootstrap()

	const res = await cli_menus.amiList(builds)

	const query = new tagger.AmiList(res.name, res.region)

	const amis = await query.inspectAmiList()
	const active = "✔"
	const showActive = (a: boolean) => {
		return (a)? chalk.green("✔"): chalk.red("✘")
	}
	const hr = () => console.log("----------------")



	console.log("Name: ", chalk.bold.cyan(res.name))
	console.log("Region: ", chalk.bold.blue(res.region))
	hr()
	console.log('Active=', showActive(true), ' In-Active=', showActive(false))
	hr()

	amis.forEach((v) => {
		let format = chalk.bold
		if (v.active) {
			format = chalk.bold.green
		}
		console.log("[" + showActive(v.active) + "]", format(v.id))
        console.log("    Published: " + chalk.blue(v.created))
        if (v.description)
            console.log("    Description: " + chalk.bold(v.description))
        if (v.activeInstances.length > 0) {
            console.log("   ", chalk.underline.cyan("Deployed Instances"))
            v.activeInstances.forEach((i) => {
                console.log("     - ",
                            chalk.green(i.name)),
                console.log("        ID: " + chalk.magenta(i.id))
                console.log("        Launched: ",
                            chalk.blue(i.launchTime))

            })
        }

	})

})

program.command("edit")
.description("Update an AMI such as promoting to active or edit description")
.arguments("<buildjs>")
.option('-a, --all', "Delete all even if active or in-use", false)
.action(async (build, ops) => {
    try {

        const buildPath = path.resolve(build)
        await import(buildPath)
        const builds = AmiBuildQueue.bootstrap()

        const ami = await cli_menus.amiList(builds, "Select AMI to edit:")

        const res = await editui.listAmis(ami.name, ami.region)

        const op = await editui.editOptions()

        switch(op) {
            case EditOption.Promote:
                console.log("Promoting: ", res.id)
                let ptag = new tagger.AmiTagger(res.region,
                                            res.name,
                                                res.id)
                await ptag.setTags(true)
                break
            case EditOption.Description:
                console.log("Promoting: ", res.id)
                let tag = new tagger.AmiTagger(res.region,
                                            res.name,
                                                res.id)
                break
        }

    } catch(err) {
        console.log("Error: ", err)
        process.exit(1)
    }

})


program.command("prune")
.description("Remove all in-active AMI's. Will not remove if an AMI is in-use. Use -a/--all flag to delete all")
.arguments("<buildjs>")
.option('-a, --all', "Delete all even if active or in-use", false)
.action(async (build, ops) => {
	const buildPath = path.resolve(build)
	await import(buildPath)
	const builds = AmiBuildQueue.bootstrap()
	const res = await cli_menus.amiCheckbox(builds, "Select AMI's to prune:")

	res.forEach(async (v) => {
		let ls = new tagger.AmiList(v.name, v.region)
		let del = (ops.all) ? await ls.getAmis():await ls.getInActiveAmis()
		del.forEach(async (vv) => {
			let tmpAmi = new tagger.AmiTagger(vv.region,
											  vv.name,
			vv.id)

			await tmpAmi.delete()

		})
	})

})


program.command("init")
.description("Init an ami project update")
.action(async (build, ops) => {

})




program.parse(process.argv)
