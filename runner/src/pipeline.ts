import crypto from "crypto";
import Docker from "dockerode";
import { Cleaner } from "./cleaner";
import { archiveFiles } from "./management/archive";
import { runContainers } from "./management/container";
import { buildImages } from "./management/image";
import { Plan, RunRequest } from "./plan";

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
 * @param request The run request.
 * @returns The pipeline run result.
 */
export async function run(request: RunRequest): Promise<PipelineRun> {
    // Declare variables.
    const runId = request.runId!;
    const tag = request.tag!;
    const plan = request.plan;
    // Start running the pipeline!
    log(runId, `Starting pipeline with tag ${tag}`);
    const cleaner = new Cleaner();
    try {
        log(runId, "Building images");
        // First, build the image for every stage.
        const imageIds = await buildImages(client, plan, cleaner);
        // Then, run every stage, passing the result between each step. Collect results.
        log(runId, "Running containers");
        const containerRun = await runContainers(client, imageIds, cleaner);
        // Archive all the important files after the pipeline ran.
        log(runId, "Archiving files");
        await archiveFiles(tag, containerRun.workspacePath, plan.archive);
        // Return the relevant information of the run.
        log(runId, "Run complete");
        return {
            status: determineOverallStatus(containerRun.stageRuns),
            stages: containerRun.stageRuns
        };
    } catch (exception) {
        log(runId, "Pipeline encountered internal error:")
        console.error(exception);
        return {
            status: "Error",
        }
    } finally {
        // Clean up everything.
        await cleaner.clean();
        log(runId, "Pipeline concluded");
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

/**
 * Logs a message.
 * @param run The run ID.
 * @param message The message to log.
 */
function log(run: string, message: string): void {
    console.log(`[${run}] ${message}`);
}