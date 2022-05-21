import express, { Request, Response } from "express";
import path from "path";
import { run } from "./pipeline";
import { Plan, isPlanValid } from "./plan";

const port: number = process.env.PORT ? parseInt(process.env.PORT) : 3000;
const archiveDir: string = process.env.ARCHIVE_DIR || path.join(__dirname, '../archive');

const app: express.Express = express();

app.use(express.json());

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
    const result = await run(plan, archiveDir);
    res.send(result);
});

app.listen(port);