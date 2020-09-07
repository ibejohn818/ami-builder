"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.drawBuildInterval = void 0;
const uitools_1 = require("./uitools");
const chalk = require("chalk");
const VERSION = require("../../package.json").version;
const formatLabel = (build) => {
    let label = `${build.task.name} (${build.task.region})`;
    return label;
};
var count = 0;
var lastStart = 0;
exports.drawBuildInterval = (builds) => {
    if (count <= 0) {
        uitools_1.clearTerminal();
    }
    let so = process.stdout;
    let rows = so.rows;
    let cols = so.columns;
    let version = "## Ami Builder Ver: " + VERSION + " ";
    let out = [];
    // draw header
    out.push(uitools_1.hr(cols));
    out.push(`Building ${builds.length} AMI(s) debug(${rows}|${cols}|${count})`);
    out.push(uitools_1.hr(cols));
    builds.forEach((v) => {
        out = out.concat(drawAmiLine(v, cols));
    });
    out.push(uitools_1.hr(cols, "#"));
    out.push(version.padEnd(cols, "#"));
    out.push(uitools_1.hr(cols, "#"));
    // content height
    let ch = out.length;
    // figure out size from bottom
    let rowStart = (ch > rows) ? 0 : (rows - ch);
    // check if we need to clear last
    if (rowStart < lastStart) {
    }
    uitools_1.clearTerminal();
    lastStart = out.length;
    // debug row starting position - add +1 to above ch var
    //out.push("Row Start: " + rowStart)
    out.forEach((v) => {
        so.cursorTo(0, rowStart++);
        so.clearLine(0);
        so.write(v);
    });
    count += 1;
};
const drawAmiLine = (build, cols) => {
    var _a;
    let l = [];
    let h = "Name: " + chalk.bold.green(build.task.name);
    h += " " + "Region: " + chalk.bold.blue(build.task.region);
    l.push(h);
    if (build.props.isActive) {
        let logLabel = "Log: ";
        let line = chalk.reset(build.props.logLine);
        let logLines = uitools_1.chunkString(line, (cols + logLabel.length));
        logLines[0] = chalk.bold(logLabel) + logLines[0];
        l = l.concat(logLines);
    }
    else if (!build.props.isActive && build.newAmiId) { // completed
        let ami = `New AMI ID: ${chalk.bold.yellow(build.newAmiId)}`;
        let uri = `Console URI: ${build.consoleAmiLink}`;
        l = l.concat(uitools_1.chunkString(ami, cols));
        l = l.concat(uitools_1.chunkString(uri, cols));
    }
    else if (!build.props.isActive && ((_a = build.newAmiId) !== null && _a !== void 0 ? _a : false)) { // error
        let msg = `Error occurred during build. View Logs in __packer__/${build.task.name}`;
        msg = chalk.red.bold(msg);
        let logLines = uitools_1.chunkString(msg, cols);
        l = l.concat(logLines);
    }
    else { // unknonw error
        let msg = chalk.red.bold("Build has stopped and reached an unknown state");
        let logLines = uitools_1.chunkString(msg, cols);
        l = l.concat(logLines);
    }
    l.push(uitools_1.hr(cols, "_"));
    return l;
};
const drawHeader = (builds, startRow, cols) => {
    let l = [];
    uitools_1.hr(cols);
    uitools_1.hr(cols);
    return [];
};
//# sourceMappingURL=buildui.js.map