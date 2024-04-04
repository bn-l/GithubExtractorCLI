

import { normalizePath, groupByOwner, parseOwnerGroups, OwnerGroup, destructurePath, executeParsedGroups } from "../source/main.mjs";
import {describe, it, expect, beforeEach, afterEach } from "vitest";
import pico from "picomatch";
import GithubExtractor from "github-extractor";
import sinon from "sinon";

import pathe from "pathe";
import fs from "fs";

import { fileURLToPath } from 'url';

const __dirname = pathe.dirname(fileURLToPath(import.meta.url));
const TEMP_DIR = pathe.resolve(__dirname, "./fixtures/temp-repo-dir/");


describe("Correct selected files given to GithubExtractor.downloadTo", async () => {

    let ownerGrouping: OwnerGroup;
    let listMode = false;
    let caseInsensitive = false;
    let conflictsOnly = false;
    let quiet = false;
    let keepIf: undefined | string = undefined;
        
    beforeEach(() => {
        sinon.restore();
    });
    afterEach(() => {
        sinon.restore();
    });

    it("correctly supplies the selected files argument when all paths are direct files", async () => {

        ownerGrouping = ownerGrouping = {
            owner1: { repo1: [ "path1.txt", "path2.txt" ] },
        };

        const parsedGroups = parseOwnerGroups({ ownerGrouping, listMode, caseInsensitive });

        const owners = parsedGroups.map(group => group.gheInstance.owner);
        const repos = parsedGroups.map(group => group.gheInstance.repo);
        const paths = parsedGroups.map(group => group.selectedFiles);
        const regexes = parsedGroups.map(group => group.regex);

        expect(owners).to.have.members(["owner1"]);
        expect(repos).to.have.members(["repo1"]);
        expect(paths).to.include.deep.members([["path1.txt", "path2.txt"]]);
        regexes.forEach(regex => expect(regex).toBeUndefined());

        const stubbedDownloadTo = sinon.stub(GithubExtractor.prototype, "downloadTo").resolves([]);
        
        await executeParsedGroups({conflictsOnly, quiet, listMode, parsedGroups, dest: TEMP_DIR, keepIf });

        expect(stubbedDownloadTo.calledOnce).toBe(true);
        expect(stubbedDownloadTo.firstCall.args[0]).to.deep.equal({
            "extractOptions": {
                "keep-existing": undefined,
                "keep-newer": undefined,
            },
            selectedPaths: ["path1.txt", "path2.txt"],
            dest: TEMP_DIR,
        });
    });


    it("correctly supplies the selected files argument when there are globs in the paths", async () => {

        ownerGrouping = ownerGrouping = {
            owner1: { repo1: [ "path1/**", "path2.txt" ] },
        };

        const parsedGroups = parseOwnerGroups({ ownerGrouping, listMode, caseInsensitive });

        const owners = parsedGroups.map(group => group.gheInstance.owner);
        const repos = parsedGroups.map(group => group.gheInstance.repo);
        const paths = parsedGroups.map(group => group.selectedFiles);
        const regexes = parsedGroups.map(group => group.regex);

        expect(owners).to.have.members(["owner1"]);
        expect(repos).to.have.members(["repo1"]);
        paths.forEach(path => expect(path).toBeUndefined());
        expect(regexes).toBeDefined();
        regexes.forEach(regex => expect(regex).toBeInstanceOf(RegExp));

        const stubbedDownloadTo = sinon.stub(GithubExtractor.prototype, "downloadTo").resolves([]);
        
        await executeParsedGroups({conflictsOnly, quiet, listMode, parsedGroups, dest: TEMP_DIR, keepIf });

        expect(stubbedDownloadTo.calledOnce).toBe(true);

        const args = stubbedDownloadTo.firstCall.args[0];
        const  {match: matchArg, ...otherArgs } = args;

        expect(matchArg).toBeInstanceOf(RegExp);

        expect(otherArgs).to.deep.equal({
            "extractOptions": {
                "keep-existing": undefined,
                "keep-newer": undefined,
            },
            dest: TEMP_DIR,
        });
    });

    it("For two owners there are two calls to downloadTo", async () => {

        ownerGrouping = ownerGrouping = {
            owner1: { repo1: [ "path1.txt" ] },
            owner2: { repo2: [ "path2.txt" ] },
        };

        const parsedGroups = parseOwnerGroups({ ownerGrouping, listMode, caseInsensitive });        
        const stubbedDownloadTo = sinon.stub(GithubExtractor.prototype, "downloadTo").resolves([]);
        
        await executeParsedGroups({conflictsOnly, quiet, listMode, parsedGroups, dest: TEMP_DIR, keepIf });

        expect(stubbedDownloadTo.callCount).toBe(2);
    });

    it("For one owner, one repo, two paths expect one call to downloadTo", async () => {

        ownerGrouping = ownerGrouping = {
            owner1: { repo1: [ "path1.txt", "path2.txt" ] },
        };

        const parsedGroups = parseOwnerGroups({ ownerGrouping, listMode, caseInsensitive });        
        const stubbedDownloadTo = sinon.stub(GithubExtractor.prototype, "downloadTo").resolves([]);
        
        await executeParsedGroups({conflictsOnly, quiet, listMode, parsedGroups, dest: TEMP_DIR, keepIf });

        expect(stubbedDownloadTo.callCount).toBe(1);
    });

    it("For one owner, two repos expect two calls to downloadTo", async () => {

        ownerGrouping = ownerGrouping = {
            owner1: { repo1: [ "path1.txt", "path2.txt" ], repo2: [ "path1.txt", "path2.txt" ] },
        };

        const parsedGroups = parseOwnerGroups({ ownerGrouping, listMode, caseInsensitive });        
        const stubbedDownloadTo = sinon.stub(GithubExtractor.prototype, "downloadTo").resolves([]);
        
        await executeParsedGroups({conflictsOnly, quiet, listMode, parsedGroups, dest: TEMP_DIR, keepIf });

        expect(stubbedDownloadTo.callCount).toBe(2);
    });

    it("It correctly supplies prefix args with owner/repo when prefix is true", async () => {

        const prefix = true;
        listMode = true;

        ownerGrouping = ownerGrouping = {
            owner1: { repo1: [ "path1.txt", "path2.txt" ], repo2: [ "path1.txt", "path2.txt" ] },
        };

        const parsedGroups = parseOwnerGroups({ ownerGrouping, listMode, caseInsensitive });        
        const stubbedList = sinon.stub(GithubExtractor.prototype, "list").resolves([]);
        
        await executeParsedGroups({conflictsOnly, quiet, listMode, parsedGroups, dest: TEMP_DIR, keepIf, prefix });

        expect(stubbedList.callCount).toBe(2);
        expect(stubbedList.firstCall.args?.[0]?.streamOptions?.prefix).toBe("owner1/repo1/");
        expect(stubbedList.secondCall.args?.[0]?.streamOptions?.prefix).toBe("owner1/repo2/");

    });

});