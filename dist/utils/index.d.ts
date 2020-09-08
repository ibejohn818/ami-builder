import { FileExtSplit } from '../types';
/**
 * Make a date object filename friendly
 */
export declare const dateForFilename: (aDate: Date) => string;
export declare const splitFileExt: (aFilePath: string) => FileExtSplit;
