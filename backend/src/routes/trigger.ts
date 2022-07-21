import { Request, Response } from "express";
import { AppDataSource } from "../data-source";
import { Pipeline } from "../entities/Pipeline";
import { User } from "../entities/User";
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
   const repository = AppDataSource.manager.getRepository(Pipeline);
   const queriedPipeline = await repository.findOne({
      where: {
         token: req.params.token,
      },
      relations: ["assignees"],
   });
   // If the pipeline does not exist, error.
   if (!queriedPipeline) {
      res.sendStatus(404);
      return;
   }
   // See if the user is assigned.
   const isUserAssigned = queriedPipeline.assignees.some((user: User): boolean => {
      return user.id === req.session.user?.id;
   });
   // Reject if the user is not assigned.
   if (!isUserAssigned) {
      res.sendStatus(403);
      return;
   }
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