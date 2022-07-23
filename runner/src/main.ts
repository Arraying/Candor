import express, { Request, Response } from "express";
import { getPath, makeLogDirectory, verifyPath } from "./logging";
import { isPlanValid, RunRequest, RunRequestRaw } from "./plan";
import { authorizationMiddleware } from "./middleware";
import crypto from "crypto";
import dotenv from "dotenv";
import { run } from "./pipeline";

// Load the environment variables.
dotenv.config();
// Manually copy over environment variable to avoid conflict with compose.
if (process.env.RUNNER_DOCKER_HOST) {
    process.env.DOCKER_HOST = process.env.RUNNER_DOCKER_HOST;
}
if (process.env.RUNNER_DOCKER_TLS_VERIFY) {
    process.env.DOCKER_TLS_VERIFY = process.env.RUNNER_DOCKER_TLS_VERIFY;
}
if (process.env.RUNNER_DOCKER_CERT_PATH) {
    process.env.DOCKER_CERT_PATH = process.env.RUNNER_DOCKER_CERT_PATH;
}
if (process.env.RUNNER_DOCKER_CLIENT_TIMEOUT) {
    process.env.DOCKER_CLIENT_TIMEOUT = process.env.RUNNER_DOCKER_CLIENT_TIMEOUT;
}

// Setup logging.
makeLogDirectory();

// Create the Express app.
const app = express();

// Add the authentication middleware.
// Exclude root.
app.use("/.+", authorizationMiddleware);
// Add the JSON middleware to handle bodies.
app.use(express.json());

app.get("/", (req: Request, res: Response) => {
    res.sendStatus(200);
    return;
})

// Add the route to run the pipeline.
app.post("/run", async (req: Request, res: Response) => {
    // Ensure the payload is sent as JSON.
    if (!req.is("json")) {
        res.sendStatus(415);
        return;
    }
    // Get the request.
    const request: RunRequestRaw = req.body;
    // Generate a run ID if not specified.
    if (!request.runId) {
        request.runId = crypto.randomBytes(6).toString("hex");
    }
    // Check if the plan is valid.
    if (request.plan == null || !isPlanValid(request.plan)) {
        res.sendStatus(400);
        return;
    }
    // Run the plan.
    const result = await run(request as RunRequest);
    res.send(result);
});

// Add the route to get a log of a pipeline run.
app.get("/logs/:runId", async (req: Request, res: Response) => {
    // Extract the run parameter, and determine the path.
    const path = getPath(req.params.runId);
    // Verify legitimacy.
    if (!verifyPath(path)) {
        // Probably someone malicious.
        res.sendStatus(400);
        console.warn(`Malicious log attempt: ${path}`);
        return;
    }
    res.sendFile(path);
});

// Listen on the correct port.
const server = app.listen(process.env.RUNNER_PORT);

// Handle ^C and SIGTERM properly.
const shutdown = () => {
    console.log("Shutting down.");
    server.close();
    process.exit(0);
}
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
