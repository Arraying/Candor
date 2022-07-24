import { logCreate, logHeader, logInfo } from "../logging";
import { RunRequest, Stage } from "../plan";
import { StageRun, workingDirectory } from "../pipeline";
import { Cleaner } from "../cleaner";
import Docker from "dockerode";

/**
 * Contains relevant information on the container run.
 * Includes the stage information, but also metadata associated to the workspace.
 */
export interface ContainerRun {
    stageRuns: StageRun[]
    lastSuccessfulContainer?: string
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
        const options: Docker.ContainerCreateOptions = {
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
            options.HostConfig?.Mounts?.push({
                Target: "/srv/candor",
                Source: process.env.RUNNER_SHARED,
                Type: "bind",
                ReadOnly: true,
            });
        }
        // Create the container and run it.
        const container = await client.createContainer(options);
        // Add deleting the container to the cleanup task.
        cleaner.addJob(async (): Promise<void> => await container.remove());
        try {
            // Write logs.
            const logStream = await container.attach({stream: true, stdout: true, stderr: true});
            container.modem.demuxStream(logStream, log, log);
            // Put the rest in a try so the container can be cleaned on error.
            await container.start();
            // Await the container's exit.
            const exit = await container.wait();
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