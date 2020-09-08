import {
    FileExtSplit,
} from '../types'

/**
 * Make a date object filename friendly
 */
export const dateForFilename = (aDate: Date): string => {
    let ts = aDate.toISOString()
    ts = ts.replace(/[\:\s]/g,"_")
    return `${ts}`
}

export const splitFileExt = (aFilePath: string): FileExtSplit => {


    let d = dateForFilename(new Date())
    let r = aFilePath.replace(/\.log$/, `.${d}.log`)
    console.log(r)

    return {
        filename: "aaa",
        ext: "aaa"
    }

}
