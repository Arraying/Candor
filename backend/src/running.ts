import { Request } from "express";

/**
 * Contains all pipeline IDs of pipelines currently in progress.
 */
export const running = new Set<number>();

export async function run(req: Request): Promise<void> {
    // This should never be the case.
    if (!req.pipeline) {
        return;
    }
    const pipeline = req.pipeline!;
    // TODO: Mark as running.
    // TODO: Create a run configuration (determine ID, runner).
    // TODO: Note down start time.
    // TODO: Execute request to runner.
    // TODO: Note down end time.
    // TODO: Write response to database.
}