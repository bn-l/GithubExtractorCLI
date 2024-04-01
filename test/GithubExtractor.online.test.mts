import { describe, expect, it, vi, beforeEach, afterEach, afterAll, beforeAll, VitestUtils } from "vitest";

import sinon, { SinonSpy } from "sinon";

vi.mock("undici", async(originalImport) => {
    const mod = await originalImport<typeof import("undici")>();
    return {
        ...mod,
        request: sinon.spy(mod.request),
    };
});

import { GithubExtractor } from "../source/GithubExtractor.mjs";
import { APIFetchError } from "../source/custom-errors.mjs";

import { request, MockAgent, setGlobalDispatcher, } from "undici";
import fs from "node:fs";

import { Readable } from "node:stream";
// import { SerializableErrror } from "tar"


const TEMP_DIR = "./test/fixtures/TEMP_DIR";


beforeAll(() => {
    // sinon.restore();
    // vi.restoreAllMocks();
    fs.mkdirSync(TEMP_DIR, { recursive: true });
});

beforeEach(async() => {
    await new Promise((res) => setTimeout(res, Math.random() * 1000));

    fs.rmSync(TEMP_DIR, { recursive: true });
    fs.mkdirSync(TEMP_DIR, { recursive: true });

    sinon.reset();
    // @ts-expect-error testing
    request.resetHistory();
    vi.restoreAllMocks();
});

afterEach(() => {
    // @ts-expect-error testing
    request.resetHistory();
    vi.restoreAllMocks();
});


afterAll(() => {

});



describe.sequential("getTarBody", context => {

    it("gets the tar immediately if the default branch is main", async() => {

        const owner = "bn-l";
        const repo = "repo" // main default branch

        const ghe = new GithubExtractor({ owner, repo });

        const res = await ghe["getTarBody"]();

        // @ts-expect-error testing
        sinon.assert.calledOnce(request);
        // @ts-expect-error testing
        sinon.assert.calledOnceWithMatch(request, `https://codeload.github.com/${ owner }/${ repo }/tar.gz/main`);

        expect(res.statusCode).toBe(200);
        expect(res.headers["content-type"]).toBe("application/x-gzip");

        sinon.reset();
    });

    
    it("makes a second call if the default branch is not main then gets it correctly", async() => {

        const owner = "bn-l";
        const repo = "repoMaster" // master default branch

        const ghe = new GithubExtractor({ owner, repo });

        const res = await ghe["getTarBody"]();

        // @ts-expect-error testing
        sinon.assert.calledTwice(request);
    
        expect(res.statusCode).toBe(200);
        expect(res.headers["content-type"]).toBe("application/x-gzip");
    });

});


describe("getRepoList", context => {

    it("returns a repo list", async() => {

        const owner = "bn-l";
        const repo = "repo"

        const outputStream = { write: sinon.fake() };

        const ghe = new GithubExtractor({ owner, repo });
        
        // @ts-expect-error testing
        const list = await ghe.list({ dest: TEMP_DIR, recursive: true, outputStream });

        expect(list).toHaveLength(4);
        expect(list).to.have.deep.members([
            { filePath: "somefile.txt", conflict: false },
            { filePath: "somefolder/", conflict: false },
            { filePath: "README.md", conflict: false },
            { filePath: "somefolder/yoohoo.html", conflict: false },
        ]);
    });
    
});


describe("downloadTo", context => {

    it("downloads the repo", async() => {

        const owner = "bn-l";
        const repo = "repo"

        const ghe = new GithubExtractor({ owner, repo });

        await ghe.downloadTo({ dest: TEMP_DIR });

        expect(fs.existsSync(`${ TEMP_DIR }/README.md`)).toBe(true);
        expect(fs.existsSync(`${ TEMP_DIR }/somefolder/yoohoo.html`)).toBe(true);
        expect(fs.existsSync(`${ TEMP_DIR }/somefile.txt`)).toBe(true);
    });

});

