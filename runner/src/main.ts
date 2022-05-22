import dotenv from "dotenv";
import express, { Request, Response } from "express";
import { securityMiddleware } from "./middleware";
import { run } from "./pipeline";
import { RunRequest, isPlanValid } from "./plan";

// Load the environment variables.
dotenv.config();

// Create the Express app.
const app = express();

// Add the authentication middleware.
app.use(securityMiddleware);
// Add the JSON middleware to handle bodies.
app.use(express.json());

// Add the route to run the pipeline.
app.post("/run", async (req: Request, res: Response) => {
    // Ensure the payload is sent as JSON.
    if (!req.is('json')) {
        res.sendStatus(415);
        return;
    }
    // Get the request.
    const request: RunRequest = req.body;
    // Set the name to untagged if there is no associated name.
    if (request.tag == null || request.tag === "") {
        request.tag = "untagged";
    }
    // Check if the plan is valid.
    if (request.plan == null || !isPlanValid(request.plan)) {
        res.sendStatus(400);
        return;
    }
    // Run the plan.
    const result = await run(request.tag, request.plan);
    res.send(result);
});

// Listen on the correct port.
app.listen(process.env.RUNNER_PORT);
