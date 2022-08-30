import { downloadFile, downloadStream } from "../s3";

import { Request, Response } from "express";
import { AppDataSource } from "../data-source";
import { log } from "../running";
import { logger } from "../logger";
import path from "path";
import { Run } from "../entities/Run";
import { Runner } from "../entities/Runner";
import tmp from "tmp";


/**
 * Gets a file that was archived as a stream.
 * @param req The request.
 * @param res The response.
 * @returns A stream or 400/404.
 */
export async function getPipelineArchive(req: Request, res: Response) {
    // Constants.
    const fileNameRaw = req.query.file;
    const mode = req.query.mode || "stream";
    const pipelineId = req.pipeline?.id;
    const runId = req.params.runId;
    if (!fileNameRaw || typeof fileNameRaw !== "string") {
        res.sendStatus(400);
        return;
    }
    const fileName = decodeURIComponent(fileNameRaw);
    try {
        // See if the run actually exists.
        const run = await getRunFromRunId(pipelineId, runId);
        // If not, error.
        if (run == null) {
            throw new Error("Run does not exist");
        }
        // Download according to mode.
        switch (mode) {
            case "stream": {
                // Get the file and stream it.
                const stream = await downloadStream(run.run_id, fileName);
                stream.pipe(res);
                break;
            }
            case "file": {
                const { name, removeCallback } = tmp.dirSync({ unsafeCleanup: true });
                try {
                    // Download to file.
                    const diskPath = path.join(name, fileName);
                    await downloadFile(run.run_id, fileName, diskPath);
                    // Download.
                    res.download(diskPath, (error: Error | undefined) => {
                        // Error handling if we can.
                        if (error && !res.headersSent) {
                            res.sendStatus(500);
                            logger.error(error);
                        }
                        // Clean up the mess.
                        removeCallback();
                    });
                } catch (error) {
                    // Only remove it in catch, finally won't work since download is async.
                    // In good cases, the res.download callback will remove the folder.
                    removeCallback();
                }
                break;
            }
            default:
                res.sendStatus(400);
        }
    } catch (error) {
        logger.warn(`[${runId}] ${error}`);
        res.status(404).send("No archive could be found");
    }
}

/**
 * Gets the pipeline log by requesting the runner than ran it.
 * @param req The request.
 * @param res The response.
 */
export async function getPipelineLog(req: Request, res: Response) {
    // Constants.
    const pipelineId = req.pipeline?.id;
    const runId = req.params.runId;
    try {
        // See if the run actually exists.
        const run = await getRunFromRunId(pipelineId, runId);
        // If not, relay that.
        if (run == null) {
            throw new Error("Run does not exist");
        }
        if (!run.runner) {
            throw new Error("Runner no longer exists");
        }
        // Get the runner.
        const runner = await AppDataSource.getRepository(Runner).findOneBy({
            id: run.runner,
        });
        // Unlikely, but you never know.
        if (!runner) {
            throw new Error("Runner could not be found");
        }
        // Request the logs from the runner.
        const logRequest = log(runner, run.run_id);
        logRequest
            // Axios wizardry.
            // Pipe the response from the runner directly into this response.
            .then(response => {
                response.data.pipe(res);
            })
            // Could happen, make sure to handle.
            .catch(error => {
                if (error.response && error.response.status === 404) {
                    res.send("No log could be found (deleted on server)");
                } else {
                    logger.error(error);
                    res.send("An error occurred");
                }
            })

    } catch (error) {
        logger.warn(`[${runId}] ${error}`);
        res.status(404).send("No log could be found");
    }
}

/**
 * Looks up a run for a pipeline given a run ID, with support for last.
 * @param pipelineId The pipeline ID, can be undefined.
 * @param runId The run ID, can be undefined.
 * @returns The run for that pipeline matching the run ID.
 */
async function getRunFromRunId(pipelineId: number | undefined, runId: string | undefined): Promise<Run | null> {
    // If it's last, try to get the last run ID.
    if (runId === "last") {
        return await AppDataSource.getRepository(Run).findOne({
            where: {
                pipeline: pipelineId,
            },
            order: {
                start: "DESC",
            },
        });
    }
    // Get it the normal way.
    return await AppDataSource.getRepository(Run).findOneBy({
        pipeline: pipelineId,
        run_id: runId,
    });   
}