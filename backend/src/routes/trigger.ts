import { Request, Response } from "express";
import { canRun, run } from "../running";

// TODO: Guarantees and thread safety.

/**
 * Triggers a pipeline.
 * @param req The request.
 * @param res The response.
 * @returns Nothing.
 */
export async function trigger(req: Request, res: Response) {
   // Reject if the pipeline cannot run.
   if (!await canRun(req)) {
      res.sendStatus(400);
      return;
   }
   // Run the pipeline.
   run(req).catch(error => {
      console.error(error);
   });
   // Don't wait for it to be done, just send the status now.
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