import Docker from "dockerode";
import { runContainers } from "./management/container";
import { buildImages, removeImages } from "./management/image";
import { Plan } from "./plan";

export type Status = "Passed" | "Failed" | "Error";
export const workingDirectory = "/home/work";

export async function run(plan: Plan): Promise<Status> {
    let imageIds = null;
    try {
        // First, build the image for every stage.
        imageIds = await buildImages(client, plan);
        // Then, run every stage, passing the result between each step.
        const workspaceMeta = await runContainers(client, imageIds);
        workspaceMeta.clean();
        return "Passed";
    } catch (exception) {
        console.log(exception);
        return "Error";
    } finally {
        // Clean up images (containers get removed automatically).
        if (imageIds != null) {
            await removeImages(client, imageIds);
        }
    }
}

const client = new Docker();
