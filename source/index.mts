#!/usr/bin/env node

import { executeParsedGroups, groupByOwner, parseOwnerGroups } from "./main.mjs";
import { c, getCli } from "./cli.mjs";

import type { OwnerGroup, ParsedGroup } from "./main.mjs";

import fsp from "node:fs/promises";
import ora, { Ora } from "ora";
import pathe from "pathe";


let debug = false;

process.on("uncaughtException", (error) => {

    if (debug) throw error;

    if (error instanceof Error) {
        console.error(`\nError: ${ error.message }\n\nIf this is a bug, report here: https://github.com/bn-l/GithubExtractorCLI/issues\n`);
        process.exit(1);
    }
    else { 
        console.error(`\nError: ${ error }\n\nIf this is a bug, report here: https://github.com/bn-l/GithubExtractorCLI/issues\n`);
        process.exit(1);
    }
});

// ? Note:
// - The cli's help text is the main documentation. All changes should begin there and then be
//    copied to the README.

// Todo:
// - Typo printing interferes with spinner. There should be one place where printing 
//    is done. Return typo messages in stead of logging.

// - inlcude  ghex -lc facebook/react | xargs rm -rf usage

// - option to skip initial dir scan
// - list with or without owner/repo prefix
// - Quick SVG based video. 
// - Longer playable .cast for website.c

// - Include example of getting the fzf install script with ghex in the main video or
//    an alt.
// - create video demo and add to readme
// - Show usages with fzf--upload ascii svg recording to docs/cli/ (by way of the README)


let spinner: Ora | undefined = undefined;
let quiet = false;

try {

    const { input: paths, flags } = getCli();
    c.showColor = flags.colors;
    debug = !!flags.debug;

    let { list: listMode = false, quiet = false, dest, caseInsensitive = false, conflictsOnly = false, prefix = false, force = false, echoPaths = false, strip } = flags;

    const ownerGrouping: OwnerGroup = groupByOwner({ paths });
    const parsedGroups: ParsedGroup[] = parseOwnerGroups({ ownerGrouping, listMode, caseInsensitive });

    if (!listMode && !quiet) {
        spinner = ora("Downloading...").start();
    }

    const typoMessages = await executeParsedGroups({ conflictsOnly, listMode, parsedGroups, dest, quiet, prefix, force, echoPaths, strip });

    if (spinner) {

        if (typoMessages.length) {
            console.log("Found the following possible typos (NB: use -i to ignore casing):\n(original -> suggested correction");
            console.log(typoMessages.join("\n") + "\n");
        }
        
        if ((await fsp.readdir(dest)).length === 0) {
            spinner.fail("No files were downloaded.");
            process.exit(1);
        }
        else {
            spinner.succeed(`Successfully downloaded to folder: file://${ pathe.resolve(dest) }`);
            process.exit(0);
        }
    }
}
catch (error) {
    if (debug) throw error;
    if (error instanceof Error && !quiet) {
        const message = `\nError: ${ error.message }\n\nIf this is a bug, report here: https://github.com/bn-l/GithubExtractorCLI/issues\n`;
        if (spinner) spinner.fail(message);
        else console.error(message);
    }
}
