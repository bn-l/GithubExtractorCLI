
// export { GithubExtractor as default } from "./GithubExtractor.mjs";

import { getCli, Option } from "./cli.mjs";

import pico from "picomatch";
import GithubExtractor from "github-extractor";


// Todo:
// - Bundle with esbuild (see: esbuild-config.json)
// - Show usages with fzf--upload ascii svg recording to docs/cli/ (by way of the README)
// - Remove console.log from cli.mts

// * Tests:
// Download and list
// - If specifying only files then the arguments to the instance should be correct
// - If specifying files / regex the arguments to the instance should be correct.
// - handles files preceeded with "/".
// - correctly treats paths ending in "/" as dirs.
// - Globs
// - Negative globs
// - Multiple repos
// - Combination of selected files and globs
//    - should respect both.
// - Combination of selected files and negative globs
//    - should respect both.
// - no colors option suppresses ansi.

const { input: paths, flags } = getCli();


function normalizePath(rPath: string) {
    if (rPath.startsWith("/")) rPath = rPath.slice(0, -1);
    if (rPath.endsWith("/")) rPath = rPath + "**";
    return rPath;
}

// Globs are converted to regexs, so paths with globs become regexs

interface OwnerGroup { [owner: string]: { [repo: string]: string[] } }

const ownerGroup: OwnerGroup = {};

for (const path of paths) {

    const normedPath = normalizePath(path);
    const [owner, repo, ...rest] = normedPath.split("/");
    const rPath = rest.join("/");

    if (!owner || !repo || !rPath) {
        throw new Error("Invalid path. Must be in the format: owner/repo/path");
    }

    ownerGroup[owner] ??= {};
    ownerGroup[owner]![repo] ??= [];
    ownerGroup[owner]![repo]!.push(rPath);
}

type ParsedGroup = { 
    gheInstance: GithubExtractor;
    kind: "files";
    selected: string[];
} | {
    gheInstance: GithubExtractor;
    kind: "regex";
    selected: RegExp[];
};

// If just one path contains a glob in an array of selections, then all must be 
//  converted to regexp.

const parsedGroups: ParsedGroup[] = [];

for (const owner in ownerGroup) {
    for (const repo in ownerGroup[owner]) {

        let rawPaths = ownerGroup[owner]![repo]!;
        const kind = rawPaths.some(rPath => pico.scan(rPath).isGlob) ? "regex" : "files";

        const gheInstance = new GithubExtractor({ 
            owner, repo, caseInsensitive: !!flags.caseInsensitive,
        });

        if (kind === "regex") {
            const selected = rawPaths.map(rPath => pico.compileRe(pico.parse(rPath), {
                nocase: !!flags.caseInsensitive,
            }));
            parsedGroups.push({ selected, kind, gheInstance });
        }
        else if (kind === "files") {
            parsedGroups.push({ selected: rawPaths, kind, gheInstance });
        }
    }
}

for (const parsedGroup of parsedGroups) {

    if (flags.list) {
        await parsedGroup.gheInstance.list({
            conflictsOnly: !!flags.conflicts,
            dest: flags.dest,
            match: parsedGroup.kind === "regex" ? parsedGroup.selected : [],
        });
        continue;
    }
    else {
        await parsedGroup.gheInstance.downloadTo({
            dest: flags.dest,
            selectedPaths: parsedGroup.kind === "files" ? parsedGroup.selected : [],
            match: parsedGroup.kind === "regex" ? parsedGroup.selected : [],
            extractOptions: {
                "keep-existing": flags.keepIf === "exsiting",
                "keep-newer": flags.keepIf === "newer",
            },
        });
    }

}
