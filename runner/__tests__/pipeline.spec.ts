import { determineOverallStatus, run, StageRun, Status } from "../src/pipeline";
import { RunRequest, Stage } from "../src/plan";
import { archiveFiles } from "../src/management/archive";
import { buildImages } from "../src/management/image";
import { createVolume } from "../src/management/volume";
import { runContainers } from "../src/management/container";

jest.mock("../src/management/container", () => ({
    runContainers: jest.fn(),
}));

jest.mock("../src/management/archive", () => ({
    archiveFiles: jest.fn(),
}));

jest.mock("../src/management/image", () => ({
    buildImages: jest.fn(),
}));

jest.mock("../src/management/volume", () => ({
    createVolume: jest.fn(),
}));


describe("Operating tests", () => {
    beforeEach(() => {
        // eslint-disable-next-line
        jest.spyOn(console, "log").mockImplementation(() => {});
    });
    afterEach(() => {
        jest.clearAllMocks();
    });
    test("Run smoothly", async () => {
        const [request, stages] = makeStages(["Passed", "Passed"]);
        use(stages, []);
        const result = await run(request);
        expect(result.status).toBe("Passed");
        expect(result.archived).toStrictEqual([]);
    });
    test("Run with failure", async () => {
        const [request, stages] = makeStages(["Passed", "Failed"]);
        use(stages, []);
        const result = await run(request);
        expect(result.status).toBe("Failed");
    });
    test("Run with failure, skipped", async () => {
        const [request, stages] = makeStages(["Failed", "Skipped"]);
        use(stages, []);
        const result = await run(request);
        expect(result.status).toBe("Failed");
    });
    test("Run smoothly, archive", async () => {
        const [request, stages] = makeStages(["Passed", "Passed"]);
        use(stages, ["foo.js", "bar.js"], "two");
        const result = await run(request);
        expect(archiveFiles).toHaveBeenCalled();
        expect(result.archived).toStrictEqual(["foo.js", "bar.js"]);
    });
    test("Run with failure, archive", async () => {
        const [request, stages] = makeStages(["Passed", "Failed"]);
        use(stages, ["foo.js", "bar.js"], "one");
        const result = await run(request);
        expect(archiveFiles).toHaveBeenCalledTimes(0);
        expect(result.archived).toBeUndefined();
    });
});

describe("Error behaviour tests", () => {

});

describe("Status computation tests", () => {
    test("Nothing was run", () => {
        expect(determineOverallStatus(undefined)).toBe("Error");
    })
    test("Everything passes", () => {
        const runs = [
            { status: "Passed" },
            { status: "Passed" },
        ];
        expect(determineOverallStatus(runs as StageRun[])).toBe("Passed");
    });
    test("Vacuously passes", () => {
        expect(determineOverallStatus([])).toBe("Passed");
    })
    test("Single failure, end", () => {
        const runs = [
            { status: "Passed" },
            { status: "Failed" },
        ];
        expect(determineOverallStatus(runs as StageRun[])).toBe("Failed");
    });
    test("Single failure, skipped", () => {
        const runs = [
            { status: "Failed" },
            { status: "Skipped" },
        ];
        expect(determineOverallStatus(runs as StageRun[])).toBe("Failed");
    });
    test("Error", () => {
        const runs = [
            { status: "Passed" },
            { status: "Error" },
        ];
        expect(determineOverallStatus(runs as StageRun[])).toBe("Error");
    });
});

function makeStages(statuses: Status[]): [RunRequest, StageRun[]] {
    const runRequest: RunRequest = {
        runId: "1234",
        plan: {
            stages: statuses.map((_, index: number): Stage => {
                return {
                    name: `Stage ${index + 1}`,
                    image: "alpine",
                }
            }),
        },
    };
    const stageRun = statuses.map((status: Status, index: number): StageRun => {
        return {
            name: `Stage ${index + 1}`,
            status: status,
            exitCode: -1,
        }
    });
    return [runRequest, stageRun];
}

function use(run: StageRun[], archived: string[], lastSuccessfulContainer = "dummy") {
    (createVolume as jest.Mock).mockResolvedValue("abc123");
    (buildImages as jest.Mock).mockResolvedValue(run.map((_, index: number): string => `i${index}`));
    (runContainers as jest.Mock).mockResolvedValue({
        stageRuns: run,
        lastSuccessfulContainer: lastSuccessfulContainer,
    });
    (archiveFiles as jest.Mock).mockResolvedValue(archived);
}
