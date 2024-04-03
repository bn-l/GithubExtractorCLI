import { normalizePath, groupByOwner, parseOwnerGroups, OwnerGroup, executeParsedGroups, ParsedGroup } from "../source/main.mjs";
import { getCli } from "../source/cli.mjs";
import {describe, it, expect, beforeEach, afterEach } from "vitest";
import pico from "picomatch";
import pathe from "pathe";
import fs from "fs";
import sinon from "sinon";

import { fileURLToPath } from 'url';

const __dirname = pathe.dirname(fileURLToPath(import.meta.url));
const TEMP_DIR = pathe.resolve(__dirname, "./fixtures/temp-repo-dir/");

beforeEach(() => {
    sinon.restore();
    try { fs.rmSync(TEMP_DIR, { recursive: true }); } catch { }
});

afterEach(() => {
    sinon.restore();
    try { fs.rmSync(TEMP_DIR, { recursive: true }); } catch { }
});


describe.sequential("End to end online testing using executeParsedGroups", async () => {



    it("does not download when given an empty ParsedGroup[]", async () => {

        const cliArguments = ["-d", TEMP_DIR, "bn-l/repo"];

        const { input: paths, flags } = getCli(cliArguments);

        let { list: listMode = false, quiet = false, dest, keepIf, caseInsensitive = false, conflictsOnly = false } = flags;

        await executeParsedGroups({ conflictsOnly, listMode, parsedGroups: [], dest, keepIf, quiet });
        
        expect(() => fs.readdirSync(TEMP_DIR, {recursive: true})).to.throw(Error);
    });


    it("correctly downloads a repo given only owner/repo", async () => {

        await new Promise(resolve => setTimeout(resolve, Math.random() * 1000));

        const cliArguments = ["-d", TEMP_DIR, "bn-l/repo"];

        const { input: paths, flags } = getCli(cliArguments);

        let { list: listMode = false, quiet = false, dest, keepIf, caseInsensitive = false, conflictsOnly = false } = flags;

        const ownerGrouping: OwnerGroup = groupByOwner({ paths });
        const parsedGroups: ParsedGroup[] = parseOwnerGroups({ ownerGrouping, listMode, caseInsensitive });

        expect(parsedGroups).toHaveLength(1);
        expect(parsedGroups?.[0]?.gheInstance.owner).toBe("bn-l");
        expect(parsedGroups?.[0]?.gheInstance.repo).toBe("repo");
        expect(parsedGroups?.[0]?.selectedFiles).toBeUndefined();
        expect(parsedGroups?.[0]?.regex).toBeUndefined();
        expect(parsedGroups?.[0]?.gheInstance.caseInsensitive).toBe(false);

        const fakeConsoleLog = sinon.stub(console, "log");

        await executeParsedGroups({ conflictsOnly, listMode, parsedGroups, dest, keepIf, quiet });

        // @ts-expect-error testing
        const files = fs.readdirSync(TEMP_DIR, {recursive: true}).map(f => pathe.normalize(f));

        const expectedFiles = [
            "somefolder",
            "README.md",
            "somefile.txt",
            "somefolder/yoohoo.html"
        ];

        expect(files).to.have.deep.members(expectedFiles);

        expect(fakeConsoleLog.callCount).toBe(0);

    });


    it("correctly logs potential typos", async () => {

        await new Promise(resolve => setTimeout(resolve, Math.random() * 1000));

        const cliArguments = ["-d", TEMP_DIR, "bn-l/repo/RAMME.md"]; // ! intentional

        const { input: paths, flags } = getCli(cliArguments);

        let { list: listMode = false, quiet = false, dest, keepIf, caseInsensitive = false, conflictsOnly = false } = flags;

        const ownerGrouping: OwnerGroup = groupByOwner({ paths });
        const parsedGroups: ParsedGroup[] = parseOwnerGroups({ ownerGrouping, listMode, caseInsensitive });

        expect(parsedGroups).toHaveLength(1);
        expect(parsedGroups?.[0]?.gheInstance.owner).toBe("bn-l");
        expect(parsedGroups?.[0]?.gheInstance.repo).toBe("repo");
        expect(parsedGroups?.[0]?.selectedFiles?.[0]).toBe("RAMME.md");
        expect(parsedGroups?.[0]?.regex).toBeUndefined();
        expect(parsedGroups?.[0]?.gheInstance.caseInsensitive).toBe(false);

        const fakeConsoleLog = sinon.stub(console, "log");

        await executeParsedGroups({ conflictsOnly, listMode, parsedGroups, dest, keepIf, quiet });

        // @ts-expect-error testing
        const files = fs.readdirSync(TEMP_DIR, {recursive: true}).map(f => pathe.normalize(f));

        const expectedFiles: string[] = [];

        expect(files).to.have.deep.members(expectedFiles);

        expect(fakeConsoleLog.callCount).toBe(1);

        expect(fakeConsoleLog.firstCall.args[0]).toContain("RAMME.md");
        expect(fakeConsoleLog.firstCall.args[0]).toContain("README.md");

    });

    it("correctly downloads a repo given only owner/repo", async () => {

        await new Promise(resolve => setTimeout(resolve, Math.random() * 1000));

        const cliArguments = ["-d", TEMP_DIR, "bn-l/repo"];

        const { input: paths, flags } = getCli(cliArguments);

        let { list: listMode = false, quiet = false, dest, keepIf, caseInsensitive = false, conflictsOnly = false } = flags;

        const ownerGrouping: OwnerGroup = groupByOwner({ paths });
        const parsedGroups: ParsedGroup[] = parseOwnerGroups({ ownerGrouping, listMode, caseInsensitive });

        expect(parsedGroups).toHaveLength(1);
        expect(parsedGroups?.[0]?.gheInstance.owner).toBe("bn-l");
        expect(parsedGroups?.[0]?.gheInstance.repo).toBe("repo");
        expect(parsedGroups?.[0]?.selectedFiles).toBeUndefined();
        expect(parsedGroups?.[0]?.regex).toBeUndefined();
        expect(parsedGroups?.[0]?.gheInstance.caseInsensitive).toBe(false);


        await executeParsedGroups({ conflictsOnly, listMode, parsedGroups, dest, keepIf, quiet });

        // @ts-expect-error testing
        const files = fs.readdirSync(TEMP_DIR, {recursive: true}).map(f => pathe.normalize(f));

        const expectedFiles = [
            "somefolder",
            "README.md",
            "somefile.txt",
            "somefolder/yoohoo.html"
        ];

        expect(files).to.have.deep.members(expectedFiles);

    });


    it("correctly throws when the paths have negative globs", async () => {

        await new Promise(resolve => setTimeout(resolve, Math.random() * 1000));

        const cliArguments = ["-d", TEMP_DIR, "!bn-l/repo/**", "bn-l/repo/README.md"];

        const { input: paths, flags } = getCli(cliArguments);

        expect(() => groupByOwner({ paths })).to.throw(Error);

    });

    it("correctly lists a repo given only owner/repo", async () => {

        await new Promise(resolve => setTimeout(resolve, Math.random() * 1000));

        fs.mkdirSync(TEMP_DIR, { recursive: true });

        const cliArguments = ["-l", "-d", TEMP_DIR, "bn-l/repo"];

        const { input: paths, flags } = getCli(cliArguments);

        let { list: listMode = false, quiet = false, dest, keepIf, caseInsensitive = false, conflictsOnly = false } = flags;

        const ownerGrouping: OwnerGroup = groupByOwner({ paths });
        const parsedGroups: ParsedGroup[] = parseOwnerGroups({ ownerGrouping, listMode, caseInsensitive });

        const stdOutSpy = sinon.spy(process.stdout, "write");

        await executeParsedGroups({ conflictsOnly, listMode, parsedGroups, dest, keepIf, quiet });

        expect(fs.readdirSync(TEMP_DIR, { recursive: true })).to.be.empty;

        sinon.assert.calledWith(stdOutSpy, sinon.match(/README\.md/));

    });

});