import { Request, Response } from "express";

/**
 * Triggers a pipeline.
 * @param req The request.
 * @param res The response.
 * @returns Nothing.
 */
 export async function trigger(req: Request, res: Response) {
    console.log(`Triggering pipeline ${req.params.token}`);
    console.log(req.query);
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