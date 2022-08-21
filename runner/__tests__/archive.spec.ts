import Docker from "dockerode";
import { promises } from "fs"
import { Readable } from "stream";
import { Cleaner } from "../src/cleaner";
import { archiveFiles } from "../src/management/archive";

// @ts-ignore Container related mocks.
jest.spyOn(Docker.prototype, "getContainer").mockImplementation(() => {
    return {
        getArchive: () => {
            return Readable.from(["foo foo bar bar"]);
        },
    };
});

jest.mock("fs", () => ({
    ...jest.requireActual("fs"),
    promises: {
        lstat: jest.fn(),
    },
}));

jest.mock("minio", () => ({
    Client: class FakeClient {
        bucketExists = () => false;
        makeBucket = jest.fn();
        fPutObject = jest.fn();
    },
}));

// Do not do anything when extracting.
jest.mock("tar", () => ({
    x: jest.fn(),
}));

const client = new Docker();
const runId: string = "abc123";

describe("Archiving tests", () => {
    const env = process.env;
    beforeEach(() => {
        jest.resetModules();
        process.env = { ...env };
    });
    afterEach(() => {
        process.env = env;
    });
    test("Ignored when no files are specified", async () => {
        const archived = await archiveFiles(client, "", runId, [], new Cleaner());
        expect(archived).toHaveLength(0);
    });
    test("Ignored when S3 credentials aren't specified", async () => {
        const archived = await archiveFiles(client, "", runId, ["file.txt"], new Cleaner());
        expect(archived).toHaveLength(0);
    });
    test("Archives pure files", async () => {
        setupEnvironment();
        // @ts-ignore
        promises.lstat.mockImplementation(async () => {
            return {
                isDirectory: () => false,
            };
        })
        const archived = await archiveFiles(client, "", runId, ["file.txt", "folder/other.txt"], new Cleaner());
        expect(archived).toContain("file.txt");
        expect(archived).toContain("other.txt");
    });
    test("Archives pure files", async () => {
        setupEnvironment();
        // @ts-ignore
        promises.lstat.mockImplementation(async () => {
            return {
                isDirectory: () => true,
            };
        })
        const archived = await archiveFiles(client, "", runId, ["folder/", "folder/other/"], new Cleaner());
        expect(archived).toHaveLength(0);
    });
});

function setupEnvironment() {
    process.env.S3_REGION = "eu-west-1";
    process.env.S3_ENDPOINT = "localhost";
    process.env.S3_PORT = "9000";
    process.env.S3_ACCESS = "user";
    process.env.S3_SECRET = "pass";
}
