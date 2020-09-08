"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.splitFileExt = exports.dateForFilename = void 0;
/**
 * Make a date object filename friendly
 */
exports.dateForFilename = (aDate) => {
    let ts = aDate.toISOString();
    ts = ts.replace(/[\:\s]/g, "_");
    return `${ts}`;
};
exports.splitFileExt = (aFilePath) => {
    let d = exports.dateForFilename(new Date());
    let r = aFilePath.replace(/\.log$/, `.${d}.log`);
    console.log(r);
    return {
        filename: "aaa",
        ext: "aaa"
    };
};
//# sourceMappingURL=index.js.map