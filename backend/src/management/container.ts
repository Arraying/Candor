import Docker from "dockerode";
import tmp from "tmp";
import { workingDirectory } from "../pipeline";

export type WorkspaceMeta = {
    name: string,
    clean: () => void,
    exitCodes: number[]
};

/**
 * Runs the pipeline containers. 
 * The result of each pipeline will be re-used for the other.
 * @param client The Docker client.
 * @param imageIds The IDs of the image, one for each stage.
 * @param volume The name of the volume to use to share data between pipeline steps.
  * @returns A promise of the workspace metadata.
 */
export async function runContainers(client: Docker, imageIds: string[]): Promise<WorkspaceMeta> {
    // Create a temporary directory which will be used as the working directory.
    const { name, removeCallback } = tmp.dirSync({ unsafeCleanup: true });
    console.log(name);
    // Keep track of the exit codes for each stage.
    let exitCodes: number[] = [];
    for (const imageId of imageIds) {
        // Configure the container options.
        const options: Docker.ContainerCreateOptions = {
            Image: imageId,
            HostConfig: {
                Binds: [`${name}:${workingDirectory}`]
            }
        };
        // Create the container and run it.
        const container = await client.createContainer(options);
        try {
            // Put the rest in a try so the container can be cleaned on error.
            await container.start();
            // Await the container's exit.
            const exit = await container.wait();
            exitCodes.push(exit.StatusCode);
        } catch (exception) {
            console.error(exception);
            exitCodes.push(-1);
        } finally {
            // Clean up the container.
            await container.remove();
        }
    }
    return { name: name, clean: removeCallback, exitCodes: exitCodes };
}