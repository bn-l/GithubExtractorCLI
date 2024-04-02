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
import { FetchError } from "../source/custom-errors.mjs";

import { request, MockAgent, setGlobalDispatcher, } from "undici";
import fs from "node:fs";

import { Readable } from "node:stream";
// import { SerializableErrror } from "tar"


const TEMP_DIR = "./test/fixtures/TEMP_DIR";

const mockAgent = new MockAgent();
mockAgent.disableNetConnect();
setGlobalDispatcher(mockAgent);
const mockPool = mockAgent.get("https://codeload.github.com");

const redirectPool = mockAgent.get("https://github.com");


// !! create real online test that tests redirect
// !! Remove sequential / delays from this`

const addRepoIntercept = () => {
    mockPool.intercept({
        path: "/bn-l/repo/tar.gz/main",
        method: "GET",
        headers: {
            "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
        }
    }).reply(200, 
        fs.readFileSync("./test/fixtures/repo-main.tar.gz"),
        { 
            headers: { 
                "content-type": "application/x-gzip",
            } 
        }
    );
}
// * Testing redirect

const addRedirectIntercept = () => {
    mockPool.intercept({
        path: "/bn-l/repo2/tar.gz/main",
        method: "GET",
        headers: {
            "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
        }
    }).reply(404);
    redirectPool.intercept({

        path: "/bn-l/repo2/archive/refs/heads/master.tar.gz",
        method: "GET",
        headers: {
            "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
        }
    }).reply(302, undefined, {
        headers: {
            'Location': 'https://codeload.github.com/bn-l/repo2/tar.gz/master'
        }
    });
    mockPool.intercept({
        path: "/bn-l/repo2/tar.gz/master",
        method: "GET",
        headers: {
            "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
        }
    }).reply(200,
        fs.readFileSync("./test/fixtures/repo-main.tar.gz"),
        { 
            headers: { 
                "content-type": "application/x-gzip",
            } 
        }
    );
}


beforeAll(() => {
    // sinon.restore();
    // vi.restoreAllMocks();
    fs.mkdirSync(TEMP_DIR, { recursive: true });
});

beforeEach(async() => {
    // await new Promise((res) => setTimeout(res, Math.random() * 1000));

    fs.mkdirSync(TEMP_DIR, { recursive: true });
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
    fs.rmSync(TEMP_DIR, { recursive: true });
});


