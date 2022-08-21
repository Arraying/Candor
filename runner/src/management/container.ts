import { logCreate, logHeader, logInfo } from "../logging";
import { RunRequest, Stage } from "../plan";
import { StageRun, workingDirectory } from "../pipeline";
import { Cleaner } from "../cleaner";
import Docker from "dockerode";
import mergician from "mergician";

/**
 * Contains relevant information on the container run.
 * Includes the stage information, but also metadata associated to the workspace.
 */
export interface ContainerRun {
    stageRuns: StageRun[]
    lastSuccessfulContainer?: string
}

/**
 * Custom timeout error that is thrown when container runtime exceeds a limit.
 */
export class StageTimeoutError extends Error {
    constructor() {
        super("Stage timeout exceeded");
        // JavaScript things...
        Object.setPrototypeOf(this, StageTimeoutError.prototype);
    }
}

/**
 * Runs the pipeline containers. 
 * The result of each pipeline will be re-used for the other.
 * @param client The Docker client.
 * @param request The run request.
 * @param volumeName The name of the volume.
 * @param imageIds The IDs of the image, one for each stage.
 * @param cleaner The cleaner.
 * @returns A promise of the workspace metadata.
 */
export async function runContainers(client: Docker, request: RunRequest, volumeName: string, imageIds: string[], runtimes: (string | undefined)[], cleaner: Cleaner): Promise<ContainerRun> {
    // Keep track of the stages so far.
    const stageRuns: StageRun[] = [];
    const stageNames = request.plan.stages.map((stage: Stage): string => stage.name);
    let lastSuccessfulContainer = undefined;
    // When a stage fails, we want to be able to skip all stages afterwards.
    let skip = false;
    // First gather system info to avoid doing it repetitively.
    const systemInfo = await client.info();
    const runtimesAvailable = Object.keys(systemInfo.Runtimes);
    // Setup logging.
    const log = logCreate(request.runId);
    // The stream can be closed.
    cleaner.addJob(async (): Promise<void> => log.close());
    // Iterate through all image IDs, each image ID is one stage.
    for (const [index, imageId] of imageIds.entries()) {
        // Log the stage, even if it gets skipped.
        await logHeader(log, index, imageIds.length);
        // Check if we are skipping.
        if (skip) {
            stageRuns.push({
                name: stageNames[index],
                status: "Skipped",
                exitCode: -1,
            });
            await logInfo(log, "Skipped");
            continue;
        }
        // Determine runtime information.
        const runtimeName = runtimes[index];
        if (runtimeName) {
            // Validate the runtime to make sure it is actually supported.
            if (!runtimesAvailable.includes(runtimeName)) {
                // Write the error and skip all subsequent runs.
                stageRuns.push({
                    name: stageNames[index],
                    status: "Error",
                    exitCode: -2,
                });
                // Again, skip.
                skip = true;
                await logInfo(log, "Runtime unavailable");
                continue;
            }
        }
        // Configure the container options.
        const candorOption = {
            Image: imageId,
            HostConfig: {
                Mounts: [
                    {
                        Target: workingDirectory,
                        Source: volumeName,
                        Type: "volume",
                        ReadOnly: false,
                    },
                ],
                Runtime: runtimeName,
            },
        };
        // Bind the shared data if applicable.
        if (process.env.RUNNER_SHARED) {
            candorOption.HostConfig.Mounts.push({
                Target: "/srv/candor",
                Source: process.env.RUNNER_SHARED,
                Type: "bind",
                ReadOnly: true,
            });
        }
        // Merge this with any custom user settings, if applicable.
        const overrideOptions = getOverrideConfig();
        const options = mergician(candorOption, overrideOptions);
        // Create the container and run it.
        const container = await client.createContainer(options);
        // Add deleting the container to the cleanup task.
        cleaner.addJob(async (): Promise<void> => await container.remove({
            // Needed in case of timeouts or other errors.
            force: true,
        }));
        try {
            // Write logs.
            const logStream = await container.attach({stream: true, stdout: true, stderr: true});
            container.modem.demuxStream(logStream, log, log);
            // Put the rest in a try so the container can be cleaned on error.
            await container.start();
            // Await the container's exit, or timeout.
            const race = [container.wait()];
            const containerTimeout = getTimeoutPromise();
            // If a timeout is set, add this to the race.
            if (containerTimeout) {
                race.push(containerTimeout);
            }
            // Try/catch the timeout.
            try {
                const exit = await Promise.race(race);
                const exitCode = exit.StatusCode;
                // Write it.
                logInfo(log, `Process exited with status code ${exitCode}`);
                if (exitCode === 0) {
                    // Exit code 0, so everything went smoothly.
                    stageRuns.push({
                        name: stageNames[index],
                        status: "Passed",
                        exitCode: exitCode,
                    });
                    // Only write successful containers.
                    lastSuccessfulContainer = container.id;
                } else {
                    // Nonzero exit code, there is a failure.
                    stageRuns.push({
                        name: stageNames[index],
                        status: "Failed",
                        exitCode: exitCode,
                    });
                    // As such, skip subsequent stages.
                    skip = true;
                }
            } catch (error) {
                // See if this error is expected/recoverable.
                if (error instanceof StageTimeoutError) {
                    // Handle the timeout.
                    logInfo(log, "Process exceeded stage execution time limit");
                    // Write the failure.
                    // The container does not need to be killed, the cleaner will remove it with force.
                    stageRuns.push({
                        name: stageNames[index],
                        status: "Failed",
                        exitCode: -3,
                    });
                    // Skip the next few ones.
                    skip = true;
                } else {
                    // Delegate the error to the main error handler.
                    throw error;
                }
            }
        } catch (exception) {
            console.error(exception);
            // Here, an exception occurred in the actual running of the container.
            stageRuns.push({
                name: stageNames[index],
                status: "Error",
                exitCode: -1,
            });
            // Again, skip.
            skip = true;
        }
    }
    // Return the information of the pipeline run.
    return {
        stageRuns: stageRuns,
        lastSuccessfulContainer: lastSuccessfulContainer,
    };
}

/**
 * Gets the container creation config override as an object.
 * @returns The override container creation config.
 */
export function getOverrideConfig(): Docker.CreateServiceOptions {
    const base64Config = process.env.RUNNER_CONTAINER_CONFIG_B;
    // If not defined, we just use no settings.
    if (!base64Config) {
        return {};
    }
    // Attempt to decode.
    try {
        const string = Buffer.from(base64Config, "base64").toString("utf-8");
        return JSON.parse(string);
    } catch (error) {
        console.log("Error decoding RUNNER_CONTAINER_CONFIG_B into UTF-8 JSON, is it correct?");
        return {};
    }
}

/**
 * Gets the timeout promise that will reject after the given timeout in seconds.
 * If the timeotu is misconfigured or set less than or equal to 0, this will return null.
 * If this returns a promise, this promise will always reject.
 * @returns A promise of the configured timeout, or null if it is misconfigured.
 */
export function getTimeoutPromise(): Promise<void> | null {
    // Make sure there is a timeout set.
    const timeout = parseInt(process.env.RUNNER_CONTAINER_TIMEOUT || "-1");
    if (isNaN(timeout) || timeout <= 0) {
        return null;
    }
    // Return the promise.
    return new Promise((_, reject) => {
        setTimeout(() => reject(new StageTimeoutError()), timeout * 1000);
    });
}