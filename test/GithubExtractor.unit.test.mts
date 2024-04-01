
import { GithubExtractor } from "../source/GithubExtractor.mjs";

import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import sinon, { SinonSpy } from "sinon";
import fsp from "node:fs/promises";
import stripAnsi from "strip-ansi";


const TEST_OWNER = "octocat";
const TEST_REPO = "Spoon-Knife";


// constructed correctly given various params.

// Methods:
// ----------
// Standard (test by indexing name)
// ----------

beforeEach(() => {
    sinon.restore();
});

afterEach(() => {
    sinon.restore();
});


it("constructs an instance", async() => {
    
    expect(() => new GithubExtractor({
        owner: TEST_OWNER,
        repo: TEST_REPO,
    })).not.toThrow();
});

describe.concurrent("normalizeTarPath unit tests", context => {

    it("removes leading folder name", async() => {
        const ghe = new GithubExtractor({
            owner: TEST_OWNER,
            repo: TEST_REPO,
        });
        expect(ghe["normalizeTarPath"]("Spoon-Knife-1.0.0/README.md")).toBe("README.md");
    });

    it("removes the leading slash if present and that's it", async() => {
        const ghe = new GithubExtractor({
            owner: TEST_OWNER,
            repo: TEST_REPO,
        });
        expect(ghe["normalizeTarPath"]("/Spoon-Knife-1.0.0/README.md")).toBe("Spoon-Knife-1.0.0/README.md");
    });

    it("converts everything to lower case if caseInsensitive is true", async() => {
        const ghe = new GithubExtractor({
            owner: TEST_OWNER,
            repo: TEST_REPO,
            caseInsensitive: true,
        });
        expect(ghe["normalizeTarPath"]("README.md")).toBe("readme.md");
    });

    it("does nothing if caseInsensitive is false and there's not slashes or whitespace", async() => {
        const ghe = new GithubExtractor({
            owner: TEST_OWNER,
            repo: TEST_REPO,
            caseInsensitive: false,
        });
        expect(ghe["normalizeTarPath"]("README.md")).toBe("README.md");
    });

    it("removes whitespace", async() => {
        const ghe = new GithubExtractor({
            owner: TEST_OWNER,
            repo: TEST_REPO,
        });
        expect(ghe["normalizeTarPath"]("  	 folder/README.md     ")).toBe("README.md");
    });


    it("does not work with windows paths", async() => {
        const ghe = new GithubExtractor({
            owner: TEST_OWNER,
            repo: TEST_REPO,
        });
        expect(ghe["normalizeTarPath"]("something\\README.md")).toBe("something\\README.md");
    });


    // --------------- normalizeFilePath ----------------------

    
    it("normalizeFilePath: does nothing if caseInsensitive is false and there's no whitespace", async() => {
        const ghe = new GithubExtractor({
            owner: TEST_OWNER,
            repo: TEST_REPO,
            caseInsensitive: false,
        });
        expect(ghe["normalizeFilePath"]("README.md")).toBe("README.md");
    });

    it("normalizeFilePath: converts everything to lower case if caseInsensitive is true", async() => {
        const ghe = new GithubExtractor({
            owner: TEST_OWNER,
            repo: TEST_REPO,
            caseInsensitive: true,
        });
        expect(ghe["normalizeFilePath"]("README.md")).toBe("readme.md");
    });

    it("normalizeFilePath: removes whitespace", async() => {
        const ghe = new GithubExtractor({
            owner: TEST_OWNER,
            repo: TEST_REPO,
        });
        expect(ghe["normalizeFilePath"]("  	 folder/README.md     ")).toBe("folder/README.md");
    });

});

// --------------- normalizePathSet ----------------------

describe("normalizePathSet unit tests", context => {

    it("converts all files to lower case if caseInsensitive is true", async() => {
        const filePathSet = new Set(["README.md", "LICENSE", "folder/README.md"]);
        const ghe = new GithubExtractor({
            owner: TEST_OWNER,
            repo: TEST_REPO,
            caseInsensitive: true,
        });
        expect(ghe["normalizePathSet"](filePathSet)).toStrictEqual(new Set(["readme.md", "license", "folder/readme.md"]));
    });

    it("does nothing if caseInsensitive is false", async() => {
        const filePathSet = new Set(["README.md", "LICENSE", "folder/README.md"]);
        const ghe = new GithubExtractor({
            owner: TEST_OWNER,
            repo: TEST_REPO,
            caseInsensitive: false,
        });
        expect(ghe["normalizePathSet"](filePathSet)).toStrictEqual(filePathSet);
    });

});


describe("getLocalDirSet unit tests", async(context) => {


    const fspReturn = ([
        { name: "testFile1.txt", isDirectory: () => false, path: "./testpath" },
        // replicating the weirdness that happens on windows.
        { name: "README.md", isDirectory: () => false, path: "./testpath/someDir"},
        { name: "someDir", isDirectory: () => true, path: "./testpath"},
        { name: "CAPITALFILE.TXT", isDirectory: () => false, path: "./testpath"},
    ]);        

    it("returns a set of files in alphabetical order", async() => {

        // @ts-expect-error testing
        const fakeFsp = sinon.stub(fsp, "readdir").resolves(fspReturn);

        const ghe = new GithubExtractor({
            owner: TEST_OWNER,
            repo: TEST_REPO,
            caseInsensitive: false,
        });
        const dirSet = await ghe.getLocalDirSet("testpath");
        expect(dirSet).toStrictEqual(new Set([
            "someDir/",
            "CAPITALFILE.TXT",
            "someDir/README.md",
            "testFile1.txt",
        ]));
    });

    it("converts all files to lower case if caseInsensitive is true", async() => {

        // @ts-expect-error testing
        const fakeFsp = sinon.stub(fsp, "readdir").resolves(fspReturn);

        const ghe = new GithubExtractor({
            owner: TEST_OWNER,
            repo: TEST_REPO,
            caseInsensitive: true,
        });
        const dirSet = await ghe.getLocalDirSet("testpath");
        expect(dirSet).toStrictEqual(new Set([
            "somedir/",
            "capitalfile.txt",
            "somedir/readme.md",
            "testfile1.txt",
        ]));
    });

});

describe("writeListItem unit tests", async(context) => {

    it("writes the file path to the output stream with highlightConflicts: false", async() => {
        const ghe = new GithubExtractor({
            owner: TEST_OWNER,
            repo: TEST_REPO,
        });

        const outputStream = { write: sinon.fake(), };
        const listItem = { filePath: "testFile1.txt", conflict: false };

        const streamOptions = { outputStream, highlightConflicts: false };

        // @ts-expect-error testing
        ghe["writeListStream"]({listItem, streamOptions});

        sinon.assert.calledWithExactly(outputStream.write, "testFile1.txt\n");
    });

    it("writes the file path to the output stream if conflict is true", async() => {
        const ghe = new GithubExtractor({
            owner: TEST_OWNER,
            repo: TEST_REPO,
        });

        const outputStream = {  write: sinon.fake(), };
        const listItem = { filePath: "testFile1.txt", conflict: true };
        const streamOptions = { outputStream, highlightConflicts: true };

        // @ts-expect-error testing
        ghe["writeListStream"]({listItem, streamOptions});

        const firtCallArgs = outputStream.write.firstCall.args;

        expect(stripAnsi(firtCallArgs[0])).toBe("testFile1.txt\n");
    });

});


describe("Handletypos works as expected", async(context) => {

    it("", async() => {
        const ghe = new GithubExtractor({ owner: TEST_OWNER, repo: TEST_REPO });

        const selectedSet = new Set(["someDir/rAdMeh.md", "loisance.txt", "kewlpucture.jpg"]);
        const pathList = ["README.md", "license", "folder/README.md", "someDir/README.md", "coolpicture.jpg"];

        const result = ghe["handleTypos"]({pathList, selectedSet});

        expect(result).toStrictEqual([
            ["someDir/rAdMeh.md", "someDir/README.md"],
            ["loisance.txt", "license"],
            ["kewlpucture.jpg", "coolpicture.jpg"],
        ]);

    });

});

