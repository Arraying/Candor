import Docker from "dockerode";
import tmp from "tmp";
import { Cleaner } from "../cleaner";
import { StageRun, workingDirectory } from "../pipeline";

/**
 * Contains relevant information on the container run.
 * Includes the stage information, but also metadata associated to the workspace.
 */
export interface ContainerRun {
    stageRuns: StageRun[]
    workspacePath: string
};

/**
 * Runs the pipeline containers. 
 * The result of each pipeline will be re-used for the other.
 * @param client The Docker client.
 * @param imageIds The IDs of the image, one for each stage.
 * @param cleaner The cleaner.
 * @returns A promise of the workspace metadata.
 */
export async function runContainers(client: Docker, imageIds: string[], cleaner: Cleaner): Promise<ContainerRun> {
    // Create a temporary directory which will be used as the working directory.
    const { name, removeCallback } = tmp.dirSync({ unsafeCleanup: true });
    // Clean it up at the end.
    cleaner.addJob(async (): Promise<void> => removeCallback());
    // Keep track of the stages so far.
    let stageRuns: StageRun[] = [];
    // When a stage fails, we want to be able to skip all stages afterwards.
    let skip = false;
    // Iterate through all image IDs, each image ID is one stage.
    for (const imageId of imageIds) {
        // Check if we are skipping.
        if (skip) {
            stageRuns.push({
                status: "Skipped",
                exitCode: -1
            });
            continue;
        }
        // Configure the container options.
        const options: Docker.ContainerCreateOptions = {
            Image: imageId,
            HostConfig: {
                Binds: [`${name}:${workingDirectory}`]
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
        workspacePath: name,
    };
}