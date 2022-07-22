import { Request, Response } from "express";
import { running } from "../running";

// TODO: Guarantees and thread safety.

/**
 * Triggers a pipeline.
 * @param req The request.
 * @param res The response.
 * @returns Nothing.
 */
export async function trigger(req: Request, res: Response) {
   // Get the pipeline.
   const queriedPipeline = req.pipeline!;
   // Reject if the pipeline is already running.
   if (running.has(queriedPipeline.id)) {
      res.sendStatus(400);
      return;
   }
   // TODO: Actually run.
   running.add(queriedPipeline.id);
   setTimeout(() => {
         running.delete(queriedPipeline.id);
   }, 20000);
   res.sendStatus(200);
}

/**
 * Triggers a pipeline, and integrates into GitHub.
 * @param req The request.
 * @param res The response.
 * @returns Nothing.
 */
export async function triggerWithGitHub(req: Request, res: Response) {
   res.sendStatus(200);
}