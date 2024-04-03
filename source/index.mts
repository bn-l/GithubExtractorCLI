
import { executeParsedGroups, groupByOwner, normalizePath, parseOwnerGroups } from "./main.mjs";
import { c, getCli } from "./cli.mjs";

import type { OwnerGroup, ParsedGroup } from "./main.mjs";

import ora, { Ora } from "ora";
import pathe from "pathe";

// Todo:
// - make sure tests aren't included in build
// - Bundle with esbuild (see: esbuild-config.json)
// - Show usages with fzf--upload ascii svg recording to docs/cli/ (by way of the README)
// - Remove console.log from cli.mts
// - clean package.json
// - clean comments. clean files
// - Check ci

// * Tests:
// - no colors option suppresses ansi.
// - Correcly returns typos
// - Test flags are set correctly by cli


const { input: paths, flags } = getCli();
c.showColor = flags.colors;

const { list: listMode = false, quiet = false, dest, keepIf, caseInsensitive = false, conflictsOnly = false } = flags;

const ownerGrouping: OwnerGroup = groupByOwner({ paths });
const parsedGroups: ParsedGroup[] = parseOwnerGroups({ ownerGrouping, listMode, caseInsensitive });

let spinner: Ora | undefined = undefined;
if (!flags.list && !flags.quiet) spinner = ora("Downloading...").start();

try {

    await executeParsedGroups({ conflictsOnly, listMode, parsedGroups, dest, keepIf, quiet });

    if (spinner) {
        spinner.succeed(`Successfully downloaded to file://${ pathe.resolve(flags.dest) }`);
    }
}
catch (error) {
    if (error instanceof Error && !quiet) {
        const message = `\nError: ${ error.message }\n`;
        if (spinner) spinner.fail(message);
        else console.error(c.error(message));
    }
}
