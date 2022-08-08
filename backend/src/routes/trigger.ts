import { Request, Response } from "express";
import { canRun, constraintsMet, run } from "../running";

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
   // Ignore if the constraints are not met.
   if (!await constraintsMet(req)) {
      res.sendStatus(204);
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
   // TODO: GitHub integration.
   res.sendStatus(200);
}