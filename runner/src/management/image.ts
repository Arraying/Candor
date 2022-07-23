import { Plan, Stage, } from "../plan";
import { Cleaner, } from "../cleaner";
import Docker from "dockerode";
import fs from "fs";
import path from "path";
import tmp from "tmp";
import { workingDirectory, } from "../pipeline";

type ImageMeta = {
    dockerfile: string,
    shell: string | null
};

const dockerfileName = "Dockerfile";
const shellName = "commands.sh";

/**
 * Builds a Docker image for every stage, such that it can be used for containers.
 * The image IDs then get returned as a promise.
 * @param client The Docker client.
 * @param plan The pipeline plan.
 * @param cleaner The cleaner.
 * @returns A promise of an array of image IDs, one per stage.
 */
export async function buildImages(client: Docker, plan: Plan, cleaner: Cleaner): Promise<string[]> {
    // First, create all the Dockerfiles as strings.
    const dockerfiles = await makeDockerfiles(plan.stages);
    // Keep track of image IDs.
    const imageIds = [];
    // Then, create a temporary directory to write these to.
    const { name, removeCallback, } = tmp.dirSync({ unsafeCleanup: true, });
    // Make sure to clean up this directory.
    cleaner.addJob(async (): Promise<void> => removeCallback());
    // Write all the Dockerfiles.
    for (const imageMeta of dockerfiles) {
        // Write the Dockerfile related information.
        const dockerfile = imageMeta.dockerfile;
        const dockerfilePath = path.join(name, dockerfileName);
        fs.writeFileSync(dockerfilePath, dockerfile);
        // Write the shell script related information.
        const shell = imageMeta.shell;
        const shellPath = path.join(name, shellName);
        if (shell != null) {
            fs.writeFileSync(shellPath, shell);
        }
        // Build the image through the Docker API.
        const src = shell ? [dockerfileName, shellName,] : [dockerfileName,];
        const buildStream = await client.buildImage({ context: name, src: src, }, { dockerfile: dockerfileName,});
        // Create a promise that awaits the image build.
        // eslint-disable-next-line
        const buildProgress: Promise<any[]> = new Promise((resolve, reject) => {
            // eslint-disable-next-line
            client.modem.followProgress(buildStream, (err: Error | null, result: any) => err ? reject(err) : resolve(result));
        });
        // Await build completion, so we can add the image ID.
        const result = await buildProgress;
        const possibleId = result
            .map(object => object.aux)
            .filter(object => object != null)
            .map(aux => aux.ID)[0]
        // Only write the image ID if it succeeded.
        if (possibleId != null) {
            imageIds.push(possibleId);
            cleaner.addJob(async (): Promise<void> => {
                // Get the image by ID.
                const image = await client.getImage(possibleId);
                // Remove the image, forcefully if applicable.
                await image.remove({ force: true, });
            });
        } else {
            throw {
                reason: "Could not find built image ID",
                result: result,
            };
        }
    }
    return imageIds;
}

/**
 * Creates a Dockerfile for every stage, as a string.
 * Then, returns a promise of all the Dockerfiles.
 * @param stages An array of stages.
 * @returns A promise of a list of Dockerfiles, as strings.
 */
async function makeDockerfiles(stages: Stage[]): Promise<ImageMeta[]> {
    const dockerfiles = [];
    // Loop through all stages.
    for (const stage of stages) {
        // Each stage has its own Dockerfile.
        let dockerfile = `FROM ${stage.image}\n
            MAINTAINER Candor\n
            WORKDIR ${workingDirectory}\n`;
        // Iterate through the environment variables if possible.
        for (const kvPair of stage.environment || []) {
            // Attempt to parse the key value pair.
            // eslint-disable-next-line
            let [key, value,] = kvPair.split("=", 2);
            // Just use the key name if malformed.
            if (value == null) {
                value = key;
            }
            // Only write if the key works.
            if (key !== "") {
                dockerfile += `ENV ${key} ${value}\n`;
            }
        }
        // Iterate through the scripts if possible.
        let shell = null;
        if (stage.script != null) {
            // Create the actual script.
            let script = "";
            for (const command of stage.script) {
                script += `${command}\n`;
            }
            shell = script;
            // Add the relevant information to the Dockerfile.
            dockerfile += `ADD ./${shellName} /${shellName}\n
                RUN chmod +x /${shellName}\n
                ENTRYPOINT ["/bin/sh"]\n
                CMD ["/${shellName}"]`;
        }
        // Write the information.
        dockerfiles.push({
            dockerfile: dockerfile,
            shell: shell,
        });
    }
    return dockerfiles;
}