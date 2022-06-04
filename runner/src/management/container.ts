import Docker from "dockerode";
import { Cleaner } from "../cleaner";
import { StageRun, workingDirectory } from "../pipeline";

/**
 * Contains relevant information on the container run.
 * Includes the stage information, but also metadata associated to the workspace.
 */
export interface ContainerRun {
    stageRuns: StageRun[]
    lastSuccessfulContainer?: string
};

/**
 * Runs the pipeline containers. 
 * The result of each pipeline will be re-used for the other.
 * @param client The Docker client.
 * @param volumeName The name of the volume.
 * @param imageIds The IDs of the image, one for each stage.
 * @param cleaner The cleaner.
 * @returns A promise of the workspace metadata.
 */
export async function runContainers(client: Docker, volumeName: string, imageIds: string[], runtimes: string[], cleaner: Cleaner): Promise<ContainerRun> {
    // Keep track of the stages so far.
    let stageRuns: StageRun[] = [];
    let lastSuccessfulContainer = undefined;
    // When a stage fails, we want to be able to skip all stages afterwards.
    let skip = false;
    // First gather system info to avoid doing it repetitively.
    const systemInfo = await client.info();
    const runtimesAvailable = Object.keys(systemInfo.Runtimes);
    // Iterate through all image IDs, each image ID is one stage.
    for (const [index, imageId] of imageIds.entries()) {
        // Check if we are skipping.
        if (skip) {
            stageRuns.push({
                status: "Skipped",
                exitCode: -1
            });
            continue;
        }
        // Determine runtime information.
        const runtimeName = runtimes[index];
        if (runtimeName) {
            // Validate the runtime to make sure it is actually supported.
            if (!runtimesAvailable.includes(runtimeName)) {
                // Write the error and skip all subsequent runs.
                stageRuns.push({
                    status: "Error",
                    exitCode: -2
                });
                // Again, skip.
                skip = true;
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
            }
        };
        // Create the container and run it.
        const container = await client.createContainer(options);
        // Add deleting the container to the cleanup task.
        cleaner.addJob(async (): Promise<void> => await container.remove());
        try {
            // Put the rest in a try so the container can be cleaned on error.
            await container.start();
            // Await the container's exit.
            const exit = await container.wait();
            const exitCode = exit.StatusCode;
            if (exitCode === 0) {
                // Exit code 0, so everything went smoothly.
                stageRuns.push({
                    status: "Passed",
                    exitCode: exitCode
                });
                // Only write successful containers.
                lastSuccessfulContainer = container.id;
            } else {
                // Nonzero exit code, there is a failure.
                stageRuns.push({
                    status: "Failed",
                    exitCode: exitCode
                });
                // As such, skip subsequent stages.
                skip = true;
            }
        } catch (exception) {
            console.error(exception);
            // Here, an exception occurred in the actual running of the container.
            stageRuns.push({
                status: "Error",
                exitCode: -1
            });
            // Again, skip.
            skip = true;
        }
    }
    // Return the information of the pipeline run.
    return {
        stageRuns: stageRuns,
        lastSuccessfulContainer: lastSuccessfulContainer
    };
}