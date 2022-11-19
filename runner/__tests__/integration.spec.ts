import { PipelineRun, run } from "../src/pipeline";
import tmp, { DirResult } from "tmp";
import Docker from "dockerode";
import DockerModem from "docker-modem";
import fs from "fs";
import path from "path";
import { RunRequest } from "../src/plan";

// Needed to get compatible runtimes.
jest.spyOn(Docker.prototype, "info").mockImplementation(async () => {
    return {
        Runtimes: {
            runc: {
                path: "runc",
            },
        },
    };
});

// Need to create a volume.
const createVolume = jest.spyOn(Docker.prototype, "createVolume");

// Need to get a volume.
const getVolume = jest.spyOn(Docker.prototype, "getVolume");

// Need to build images.
const buildImage = jest.spyOn(Docker.prototype, "buildImage");

// Need to resolve single images.
const getImage = jest.spyOn(Docker.prototype, "getImage");

// Container related mocks.
const createContainer = jest.spyOn(Docker.prototype, "createContainer");

// Mock the modem to follow progress.
// eslint-disable-next-line
const followProgress = jest.spyOn(DockerModem.prototype, "followProgress");

const testRunId = "abc123";

// Mock run request that would perform this very unit test! Mind = blown.
const runRequest: RunRequest = {
    runId: testRunId,
    plan: {
        stages: [
            {
                name: "Clone",
                image: "alpine/git",
                script: ["git clone https://github.com/Arraying/Candor.git /home/work"],
            },
            {
                name: "Install",
                image: "node",
                script: [
                    "cd runner",
                    "npm install",
                ],
            },
            {
                name: "Test",
                image: "node",
                script: [
                    "cd runner",
                    "npm run test",
                ],
            },
        ],
    },
};

const errorResponse: PipelineRun = {
    status: "Error",
};

describe("Bad weather recovery tests", () => {
    const env = process.env;
    let logDir: string, logDirCleaner: () => void;
    beforeEach(() => {
        jest.resetModules();
        process.env = { ...env };
        const tempLogDir = setupLoggingDirectory();
        logDir = tempLogDir.name;
        logDirCleaner = tempLogDir.removeCallback;
    });
    afterEach(() => {
        // https://github.com/raszi/node-tmp/issues/274
        try {
            logDirCleaner();
        } catch (error) {
            // This should not fail the second time... usually.
            logDirCleaner();
        }
        process.env = env;
    });
    test("Recovery when image creation fails", async () => {
        const mockedVolume = mockVolume();
        createVolume.mockImplementation(async () => {
            const volume: unknown = {
                name: "testvolume",
            };
            return volume as Docker.VolumeCreateResponse;
        });
        getVolume.mockImplementation(() => {
            return mockedVolume as unknown as Docker.Volume;
        });
        buildImage.mockRejectedValue(new Error("test error"));
        const response = await run(runRequest);
        expect(response).toStrictEqual(errorResponse);
        expect(mockedVolume.remove).toBeCalled();
    });
    test("Recovery when image progress track fails", async () => {
        const mockedVolume = mockVolume();
        createVolume.mockImplementation(async () => {
            const volume: unknown = {
                name: "testvolume",
            };
            return volume as Docker.VolumeCreateResponse;
        });
        getVolume.mockImplementation(() => {
            return mockedVolume as unknown as Docker.Volume;
        });
        buildImage.mockImplementation(async (): Promise<NodeJS.ReadableStream> => {
            return undefined as unknown as NodeJS.ReadableStream;
        });
        // eslint-disable-next-line
        followProgress.mockImplementation((_: any, onFinished: (error: Error | null, result: any[]) => void) => {
            onFinished(new Error("test error"), []);
        });
        const response = await run(runRequest);
        expect(response).toStrictEqual(errorResponse);
        expect(mockedVolume.remove).toBeCalled();
    });
    test("Recovery when image find fails", async () => {
        const mockedVolume = mockVolume();
        const mockedImage = mockImage();
        createVolume.mockImplementation(async () => {
            const volume: unknown = {
                name: "testvolume",
            };
            return volume as Docker.VolumeCreateResponse;
        });
        getVolume.mockImplementation(() => {
            return mockedVolume as unknown as Docker.Volume;
        });
        buildImage.mockImplementation(async (): Promise<NodeJS.ReadableStream> => {
            return undefined as unknown as NodeJS.ReadableStream;
        });
        getImage.mockImplementation((): Docker.Image => {
            return mockedImage as unknown as Docker.Image;
        });
        // eslint-disable-next-line
        followProgress.mockImplementation((_: any, onFinished: (error: Error | null, result: any[]) => void) => {
            onFinished(null, []);
        });
        const response = await run(runRequest);
        expect(response).toStrictEqual(errorResponse);
        expect(mockedVolume.remove).toBeCalled();
    });
    test("Recovery when container creation fails", async () => {
        const mockedVolume = mockVolume();
        const mockedImage = mockImage();
        createVolume.mockImplementation(async () => {
            const volume: unknown = {
                name: "testvolume",
            };
            return volume as Docker.VolumeCreateResponse;
        });
        getVolume.mockImplementation(() => {
            return mockedVolume as unknown as Docker.Volume;
        });
        buildImage.mockImplementation(async (): Promise<NodeJS.ReadableStream> => {
            return undefined as unknown as NodeJS.ReadableStream;
        });
        getImage.mockImplementation((): Docker.Image => {
            return mockedImage as unknown as Docker.Image;
        });
        mockProgress();
        createContainer.mockRejectedValue(new Error("test error"));
        const response = await run(runRequest);
        expect(response).toStrictEqual(errorResponse);
        expect(mockedVolume.remove).toBeCalled();
        expect(mockedImage.remove).toBeCalledTimes(3);
        const logged = getLogContents(logDir);
        expect(logged).toContain("1/3");
        expect(logged).not.toContain("2/3");
    });
    test("Recovery when container waiting fails soon", async () => {
        const mockedVolume = mockVolume();
        const mockedImage = mockImage();
        const mockedContainer = mockContainer(() => 0, () => {
            return -1;
        });
        createVolume.mockImplementation(async () => {
            const volume: unknown = {
                name: "testvolume",
            };
            return volume as Docker.VolumeCreateResponse;
        });
        getVolume.mockImplementation(() => {
            return mockedVolume as unknown as Docker.Volume;
        });
        buildImage.mockImplementation(async (): Promise<NodeJS.ReadableStream> => {
            return undefined as unknown as NodeJS.ReadableStream;
        });
        getImage.mockImplementation((): Docker.Image => {
            return mockedImage as unknown as Docker.Image;
        });
        mockProgress();
        createContainer.mockImplementation(async (): Promise<Docker.Container> => {
            return mockedContainer as unknown as Docker.Container;
        });
        const response = await run(runRequest);
        expect(response).toStrictEqual({
            status: "Error",
            stages: [
                {
                    exitCode: -1,
                    name: "Clone",
                    status: "Error",
                },
                {
                    exitCode: -1,
                    name: "Install",
                    status: "Skipped",
                },
                {
                    exitCode: -1,
                    name: "Test",
                    status: "Skipped",
                },
            ],
        });
        expect(mockedVolume.remove).toBeCalled();
        expect(mockedImage.remove).toBeCalledTimes(3);
        expect(mockedContainer.remove).toBeCalledTimes(1);
        const logged = getLogContents(logDir);
        expect(logged).toContain("1/3");
        expect(logged).toContain("2/3");
        expect(logged).toContain("3/3");
    });
    test("Recovery when container waiting fails later", async () => {
        let mockContainerCounter = 0;
        const mockedVolume = mockVolume();
        const mockedImage = mockImage();
        // Make it fail only on the third container.
        const mockedContainer = mockContainer(() => 0, () => {
            if (mockContainerCounter === 2) {
                return -1;
            }
            mockContainerCounter++;
            return 1;
        });
        createVolume.mockImplementation(async () => {
            const volume: unknown = {
                name: "testvolume",
            };
            return volume as Docker.VolumeCreateResponse;
        });
        getVolume.mockImplementation(() => {
            return mockedVolume as unknown as Docker.Volume;
        });
        buildImage.mockImplementation(async (): Promise<NodeJS.ReadableStream> => {
            return undefined as unknown as NodeJS.ReadableStream;
        });
        getImage.mockImplementation((): Docker.Image => {
            return mockedImage as unknown as Docker.Image;
        });
        mockProgress();
        createContainer.mockImplementation(async (): Promise<Docker.Container> => {
            return mockedContainer as unknown as Docker.Container;
        });
        const response = await run(runRequest);
        expect(response).toStrictEqual({
            status: "Error",
            stages: [
                {
                    exitCode: 0,
                    name: "Clone",
                    status: "Passed",
                },
                {
                    exitCode: 0,
                    name: "Install",
                    status: "Passed",
                },
                {
                    exitCode: -1,
                    name: "Test",
                    status: "Error",
                },
            ],
        });
        expect(mockedVolume.remove).toBeCalled();
        expect(mockedImage.remove).toBeCalledTimes(3);
        expect(mockedContainer.remove).toBeCalledTimes(3);
        const logged = getLogContents(logDir);
        expect(logged).toContain("1/3");
        expect(logged).toContain("2/3");
        expect(logged).toContain("3/3");
    });
});

describe("Bad weather behaviour tests", () => {
    const env = process.env;
    let logDirCleaner: () => void;
    beforeEach(() => {
        jest.resetModules();
        process.env = { ...env };
        const tempLogDir = setupLoggingDirectory();
        logDirCleaner = tempLogDir.removeCallback;
    });
    afterEach(() => {
        // https://github.com/raszi/node-tmp/issues/274
        try {
            logDirCleaner();
        } catch (error) {
            // This should not fail the second time... usually.
            logDirCleaner();
        }
        process.env = env;
    });
    test("Fails when the runtime is unavailable", async () => {
        const mockedVolume = mockVolume();
        const mockedImage = mockImage();
        const mockedContainer = mockContainer(() => 0, () => {
            return 10;
        });
        createVolume.mockImplementation(async () => {
            const volume: unknown = {
                name: "testvolume",
            };
            return volume as Docker.VolumeCreateResponse;
        });
        getVolume.mockImplementation(() => {
            return mockedVolume as unknown as Docker.Volume;
        });
        buildImage.mockImplementation(async (): Promise<NodeJS.ReadableStream> => {
            return undefined as unknown as NodeJS.ReadableStream;
        });
        getImage.mockImplementation((): Docker.Image => {
            return mockedImage as unknown as Docker.Image;
        });
        mockProgress();
        createContainer.mockImplementation(async (): Promise<Docker.Container> => {
            return mockedContainer as unknown as Docker.Container;
        });
        const invalidRunRequest = {
            runId: testRunId,
            plan: {
                stages: [{
                    name: "Test",
                    image: "alpine",
                    runtime: "sysbox",
                }],
            },
        };
        const response = await run(invalidRunRequest);
        expect(response).toStrictEqual({
            status: "Error",
            stages: [{
                exitCode: -2,
                name: "Test",
                status: "Error",
            }],
        });
    });
    test("Fails when container exits with nonzero code", async () => {
        let mockContainerCounter = 0;
        const mockedVolume = mockVolume();
        const mockedImage = mockImage();
        const mockedContainer = mockContainer((): number => {
            if (mockContainerCounter === 1) {
                return 1;
            }
            mockContainerCounter++;
            return 0;
        }, () => 10);
        createVolume.mockImplementation(async () => {
            const volume: unknown = {
                name: "testvolume",
            };
            return volume as Docker.VolumeCreateResponse;
        });
        getVolume.mockImplementation(() => {
            return mockedVolume as unknown as Docker.Volume;
        });
        buildImage.mockImplementation(async (): Promise<NodeJS.ReadableStream> => {
            return undefined as unknown as NodeJS.ReadableStream;
        });
        getImage.mockImplementation((): Docker.Image => {
            return mockedImage as unknown as Docker.Image;
        });
        mockProgress();
        createContainer.mockImplementation(async (): Promise<Docker.Container> => {
            return mockedContainer as unknown as Docker.Container;
        });
        const response = await run(runRequest);
        expect(response).toStrictEqual({
            status: "Failed",
            stages: [
                {
                    exitCode: 0,
                    name: "Clone",
                    status: "Passed",
                },
                {
                    exitCode: 1,
                    name: "Install",
                    status: "Failed",
                },
                {
                    exitCode: -1,
                    name: "Test",
                    status: "Skipped",
                },
            ],
        });
    });
});

describe("Timeout tests", () => {
    const env = process.env;
    let logDir: string, logDirCleaner: () => void;
    beforeEach(() => {
        jest.resetModules();
        process.env = { ...env };
        const tempLogDir = setupLoggingDirectory();
        logDir = tempLogDir.name;
        logDirCleaner = tempLogDir.removeCallback;
    });
    afterEach(() => {
        // https://github.com/raszi/node-tmp/issues/274
        try {
            logDirCleaner();
        } catch (error) {
            // This should not fail the second time... usually.
            logDirCleaner();
        }
        process.env = env;
    });
    // Implicitly also a good weather test.
    test("Passes with generous timeout", async () => {
        process.env.RUNNER_SHARED = "/does/not/matter";
        process.env.RUNNER_CONTAINER_TIMEOUT = "3600";
        const mockedVolume = mockVolume();
        const mockedImage = mockImage();
        const mockedContainer = mockContainer(() => 0, () => {
            return 10;
        });
        createVolume.mockImplementation(async () => {
            const volume: unknown = {
                name: "testvolume",
            };
            return volume as Docker.VolumeCreateResponse;
        });
        getVolume.mockImplementation(() => {
            return mockedVolume as unknown as Docker.Volume;
        });
        buildImage.mockImplementation(async (): Promise<NodeJS.ReadableStream> => {
            return undefined as unknown as NodeJS.ReadableStream;
        });
        getImage.mockImplementation((): Docker.Image => {
            return mockedImage as unknown as Docker.Image;
        });
        mockProgress();
        createContainer.mockImplementation(async (): Promise<Docker.Container> => {
            return mockedContainer as unknown as Docker.Container;
        });
        const response = await run(runRequest);
        expect(response).toStrictEqual({
            status: "Passed",
            stages: [
                {
                    name: "Clone",
                    exitCode: 0,
                    status: "Passed",
                },
                {
                    name: "Install",
                    exitCode: 0,
                    status: "Passed",
                },
                {
                    name: "Test",
                    exitCode: 0,
                    status: "Passed",
                },
            ],
        });
        expect(mockedVolume.remove).toBeCalled();
        expect(mockedImage.remove).toBeCalledTimes(3);
        expect(mockedContainer.remove).toBeCalledTimes(3);
        const logged = getLogContents(logDir);
        expect(logged).toContain("1/3");
        expect(logged).toContain("2/3");
        expect(logged).toContain("3/3");
    });
    // Implicitly also a good weather test for the failed stages.
    test("Fails when timeout is exceeded", async () => {
        process.env.RUNNER_CONTAINER_TIMEOUT = "1";
        const mockedVolume = mockVolume();
        const mockedImage = mockImage();
        const mockedContainer = mockContainer(() => 0, () => {
            return 1001;
        });
        createVolume.mockImplementation(async () => {
            const volume: unknown = {
                name: "testvolume",
            };
            return volume as Docker.VolumeCreateResponse;
        });
        getVolume.mockImplementation(() => {
            return mockedVolume as unknown as Docker.Volume;
        });
        buildImage.mockImplementation(async (): Promise<NodeJS.ReadableStream> => {
            return undefined as unknown as NodeJS.ReadableStream;
        });
        getImage.mockImplementation((): Docker.Image => {
            return mockedImage as unknown as Docker.Image;
        });
        mockProgress();
        createContainer.mockImplementation(async (): Promise<Docker.Container> => {
            return mockedContainer as unknown as Docker.Container;
        });
        const response = await run(runRequest);
        expect(response).toStrictEqual({
            status: "Failed",
            stages: [
                {
                    name: "Clone",
                    exitCode: -3,
                    status: "Failed",
                },
                {
                    name: "Install",
                    exitCode: -1,
                    status: "Skipped",
                },
                {
                    name: "Test",
                    exitCode: -1,
                    status: "Skipped",
                },
            ],
        });
        expect(mockedVolume.remove).toBeCalled();
        expect(mockedImage.remove).toBeCalledTimes(3);
        expect(mockedContainer.remove).toBeCalledTimes(1);
        const logged = getLogContents(logDir);
        expect(logged).toContain("1/3");
        expect(logged).toContain("2/3");
        expect(logged).toContain("3/3");
        expect(logged).toContain("time limit");
    });
});

function mockVolume() {
    return {
        name: "testvolume",
        remove: jest.fn(),
    };
}

function mockImage() {
    return {
        remove: jest.fn(),
    };
}

function mockContainer(statusCode: () => number, howLongItTakes: () => number) {
    return {
        modem: {
            demuxStream: jest.fn(),
        },
        attach: jest.fn(),
        start: jest.fn(),
        wait: () => {
            return new Promise((resolve, reject) => {
                const time = howLongItTakes();
                if (time < 0) {
                    reject(new Error("test error"));
                    return;
                }
                setTimeout(() => {
                    resolve({
                        StatusCode: statusCode(),
                    });
                }, time);
            });
        },
        remove: jest.fn(),
    };
}

function mockProgress() {
    // eslint-disable-next-line
    followProgress.mockImplementation((_: any, onFinished: (error: Error | null, result: any[]) => void) => {
        onFinished(null, [{
                aux: {
                    ID: "testimage",
                },
            },
        ]);
    });
}

function getLogContents(dir: string): string {
    const location = path.join(dir, `${testRunId}.log`);
    return fs.readFileSync(location, "utf-8");
}

function setupLoggingDirectory(): DirResult {
    const dirResult = tmp.dirSync({ unsafeCleanup: true });
    process.env.RUNNER_LOGS = dirResult.name;
    return dirResult;
}