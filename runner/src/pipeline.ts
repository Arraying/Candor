import Docker from "dockerode";
import { Cleaner } from "./cleaner";
import { archiveFiles } from "./management/archive";
import { runContainers } from "./management/container";
import { buildImages } from "./management/image";
import { Plan } from "./plan";

/**
 * The status of the pipeline or its individual stages.
 * Passed -> Everything is okay.
 * Failed -> A stage failed in the pipeline, but the pipeline is okay.
 * Skipped -> A stage was skipped since one of its predecessors failed.
 * Error -> The pipeline or one of its stages is malformed.
 */
export type Status = "Passed" | "Failed" | "Skipped" | "Error";

/**
 * Shows information on the pipeline run.
 * Specifically, the status of the overall pipeline, as well as that of individual stages.
 */
export interface PipelineRun {
    status: Status
    stages?: StageRun[]
}

/**
 * Shows information on a single stage.
 * Contains the status of the stage and the exit code of its container.
 */
export interface StageRun {
    status: Status
    exitCode: number
}

/** 
 * The Docker client.
 */
const client = new Docker();

/** 
 * The directory in which all the work will be performed.
 */
export const workingDirectory = "/home/work";

/**
 * Runs the entire pipeline.
 * @param tag The run tag.
 * @param plan The pipeline plan.
 * @returns The pipeline run result.
 */
export async function run(tag: string, plan: Plan): Promise<PipelineRun> {
    const cleaner = new Cleaner();
    try {
        // First, build the image for every stage.
        const imageIds = await buildImages(client, plan, cleaner);
        // Then, run every stage, passing the result between each step. Collect results.
        const containerRun = await runContainers(client, imageIds, cleaner);
        // Archive all the important files after the pipeline ran.
        await archiveFiles(tag, containerRun.workspacePath, plan.archive);
        // Return the relevant information of the run.
        return {
            status: determineOverallStatus(containerRun.stageRuns),
            stages: containerRun.stageRuns
        };
    } catch (exception) {
        console.error(exception);
        return {
            status: "Error",
        }
    } finally {
        // Clean up everything.
        await cleaner.clean();
    }
}

/**
 * Calculates the overall pipeline status code based off of the stage runs.
 * @param stageRuns An array of all the stage runs if applicable.
 * @returns The overall pipeline status code.
 */
function determineOverallStatus(stageRuns?: StageRun[]): Status {
    if (stageRuns) {
        // Go through every run.
        for (const run of stageRuns) {
            // If there is an error, then overall there should be an error.
            if (run.status === "Error") {
                return "Error";
            }
            // If one stage failed, the pipeline has failed.
            else if (run.status === "Failed") {
                return "Failed";
            }
        }
        // Even if there are skips without fails, these can be ignored.
        return "Passed";
    }
    // If there are no stage runs, there must have been an error.
    return "Error";
}