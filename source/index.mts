
import { executeParsedGroups, groupByOwner, normalizePath, parseOwnerGroups } from "./main.mjs";
import { c, getCli } from "./cli.mjs";

import type { OwnerGroup, ParsedGroup } from "./main.mjs";

import pathe from "pathe";

// Todo:
// - make sure tests aren't included in build
// - Bundle with esbuild (see: esbuild-config.json)
// - Show usages with fzf--upload ascii svg recording to docs/cli/ (by way of the README)
// - Remove console.log from cli.mts
// - clean package.json
// - clean comments

// * Tests:
// Download and list
// - If specifying only direct file paths then the arguments to the instance should be correct
// - If specifying direct file paths mixed with globs, the arguments to the instance should be correct.
// - Should handle files preceeded with "/".
// - Should correctly treat paths ending in "/" as dirs.
// - Should correctly handle each glob type. ** and *. With * it should only get the top level directory.
// - Negative globs
// - Multiple repos
// - Combination of selected files and globs
//    - should respect both.
// - Combination of selected files and negative globs
//    - should respect both.
// - no colors option suppresses ansi.
// - Correcly returns typos


const { input: paths, flags } = getCli();
c.showColor = flags.colors;

let { list: listMode = false, quiet = false, dest, keepIf, caseInsensitive = false, conflictsOnly = false } = flags;

const ownerGrouping: OwnerGroup = groupByOwner({ paths });
const parsedGroups: ParsedGroup[] = parseOwnerGroups({ ownerGrouping, listMode, caseInsensitive });


try {
    await executeParsedGroups({ conflictsOnly, listMode, parsedGroups, dest, keepIf, quiet });
    if (!flags.list && !flags.quiet) {
        console.log(c.success(`Successfully downloaded to ${ pathe.resolve(flags.dest) }`));
    }
}
catch (error) {
    if (error instanceof Error && !quiet) {
        console.log(c.error(`\n${ error.message }\n`));
    }
}
