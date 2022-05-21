import Docker from "dockerode";
import fs from "fs";
import path from "path";
import tmp from "tmp";
import { Plan, Stage } from "../plan";

export async function buildRequiredImages(client: Docker, plan: Plan): Promise<string[]> {
    // First, create all the Dockerfiles as strings.
    const dockerfiles = await generateStageDockerfiles(plan.stages);
    // Keep track of image IDs.
    let imageIds = [];
    // Then, create a temporary directory to write these to.
    const { name, removeCallback } = tmp.dirSync();
    // Write all the Dockerfiles.
    for (const [i, dockerfile] of dockerfiles.entries()) {
        const dockerfileName = `Dockerfile${i}`;
        const dockerfilePath = path.join(name, dockerfileName);
        fs.writeFileSync(dockerfilePath, dockerfile);
        // Build the image through the Docker API.
        const buildStream = await client.buildImage({ context: name, src: [dockerfileName] }, { dockerfile: dockerfileName});
        // Create a promise that awaits the image build.
        const buildProgress: Promise<any[]> = new Promise((resolve, reject) => {
            client.modem.followProgress(buildStream, (err: Error | null, result: any) => err ? reject(err) : resolve(result));
        });
        // Await build completion, so we can add the image ID.
        const result = await buildProgress;
        const possibleId = result
            .map(object => object.aux)
            .filter(object => object != null)
            .map(aux => aux.ID)
            [0]
        // Only write the image ID if it succeeded.
        if (possibleId != null) {
            imageIds.push(possibleId);
        } else {
            throw 'Could not find built image ID';
        }
        // Clean up the Dockerfile.
        fs.rmSync(dockerfilePath);
    }
    // Remove the temporary directory.
    removeCallback();
    return imageIds;
}

async function generateStageDockerfiles(stages: Stage[]): Promise<string[]> {
    let dockerfiles = [];
    // Loop through all stages.
    for (const stage of stages) {
        // Each stage has its own Dockerfile.
        let dockerfile = `FROM ${stage.image}\n`;
        // Iterate through the environment variables if possible.
        for (const kvPair of stage.environment || []) {
            // Attempt to parse the key value pair.
            let [key, value] = kvPair.split('=', 2);
            // Just use the key name if malformed.
            if (value == null) {
                value = key;
            }
            // Only write if the key works.
            if (key !== '') {
                dockerfile += `ENV ${key} ${value}\n`;
            }
        }
        // Iterate through the scripts if possible.
        dockerfiles.push(dockerfile);
    }
    return dockerfiles;
}