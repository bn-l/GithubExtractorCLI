
import { executeParsedGroups, groupByOwner, parseOwnerGroups } from "./main.mjs";
import { c, getCli } from "./cli.mjs";


import type { OwnerGroup, ParsedGroup } from "./main.mjs";

import ora, { Ora } from "ora";
import pathe from "pathe";
import wrapAnsi from "wrap-ansi";

// name

// Todo:
// - Add to docs website under "CLI". Import github readme file in <script setup> tags + add 
//     small blurb 
// - create video demo and add to readme
// - Show usages with fzf--upload ascii svg recording to docs/cli/ (by way of the README)

let spinner: Ora | undefined = undefined;
let quiet = false;

try {

    const { input: paths, flags } = getCli();
    c.showColor = flags.colors;

    let { list: listMode = false, quiet = false, dest, keepIf, caseInsensitive = false, conflictsOnly = false } = flags;

    const ownerGrouping: OwnerGroup = groupByOwner({ paths });
    const parsedGroups: ParsedGroup[] = parseOwnerGroups({ ownerGrouping, listMode, caseInsensitive });

    if (!listMode && !quiet) spinner = ora("Downloading...").start();

    await executeParsedGroups({ conflictsOnly, listMode, parsedGroups, dest, keepIf, quiet });

    if (spinner) {
        spinner.succeed(`Successfully downloaded to file://${ pathe.resolve(dest) }`);
    }
}
catch (error) {
    
    if (error instanceof Error && !quiet) {
        const message = wrapAnsi(`\nError: ${ error.message }\n\nIf this is a bug, report here: https://github.com/bn-l/GithubExtractorCLI/issues\n`, 90, { hard: false });
        if (spinner) spinner.fail(message);
        else console.error(message);
    }
}
