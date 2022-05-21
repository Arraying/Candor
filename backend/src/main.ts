import dotenv from "dotenv";
import express, { Request, Response } from "express";
import path from "path";
import { setup } from "./database";
import { run } from "./pipeline";
import { Plan, isPlanValid } from "./plan";
import { makeAdmin } from "./routes/admin";

// Load the environment variables.
dotenv.config({
    path: process.env.NODE_ENV === "production" ? ".env" : "../.env"
});

// Setup the database.
setup().then(() => {
    // Create the Express app.
    const app = express();
    // Use JSON middleware to handle JSON requests in bodies.
    app.use(express.json());
    // Route to make an admin user.
    app.post("/makeadmin", makeAdmin);
    
    app.post('/ci/run', async (req: Request, res: Response) => {
        if (!req.is('json')) {
            // Unsupported Media Type.
            return res.sendStatus(415);
        }
        const plan: Plan = req.body;
        if (!isPlanValid(plan)) {
            // Bad Request.
            return res.sendStatus(400);
        }
        const result = await run(plan, path.join(__dirname, process.env.ARCHIVE || 'archive'));
        res.send(result);
    });
    
    // Listen on the correct port.
    app.listen(process.env.PORT);
});
