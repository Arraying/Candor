import { getPipeline, listPipelines } from "./routes/pipeline-read";
import { getPipelineArchive, getPipelineLog } from "./routes/pipeline-runs";
import { getPipelineConfig, setPipelineConfig } from "./routes/pipeline-config";
import { login, logout, me } from "./routes/auth";
import { pipelineInspectBuilder, pipelineInteractBuilder, getPipelineFromRequest } from "./middleware/security";
import { trigger, triggerWithGitHub } from "./routes/pipeline-trigger";
import connectPgSimple from "connect-pg-simple";
import cors from "cors";
import express from "express";
import expressSession from "express-session";
import { Pipeline } from "./entities/Pipeline";
import { User } from "./entities/User";


// Import the correct type definitions.
declare module "express-session" {
    interface SessionData {
        user: User
    }
}

// 
declare module "express" {
    export interface Request {
       pipeline?: Pipeline
    }
 }

// The path where all the static material is rendered.
// This is where Svelte should compile to.
const DASHBOARD_PUBLIC = process.env.DASHBOARD_PUBLIC || "../frontend/public";
// The cookie secret.
const COOKIE_SECRET = process.env.DASHBOARD_COOKIE_SECRET || "legends never die";

// Create the server.
const app = express();
// Create the session store.
const pgSessionStore = connectPgSimple(expressSession);

// Use static for the SPA.
app.use(express.static(DASHBOARD_PUBLIC));
// Use JSON for API.
app.use(express.json());
// Allow CORS.
app.use(cors({
    credentials: true,
    origin: process.env.DASHBOARD_ORIGIN,
}))

// Use sessions.
app.use(expressSession({
    store: new pgSessionStore({
        // Database credentials pulled from environment.
        tableName: "sessions",
    }),
    secret: COOKIE_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
        maxAge: 30 * 24 * 3600 * 1000, // 30 days.
    },
}));

// Allow reverse proxy in production.
if (process.env.NODE_ENV === "production") {
    app.set("trust proxy", 1);
}

// Authentication routes.
app.get("/me", me);
app.post("/login", login);
app.post("/logout", logout);

// Pipeline routes.
app.get("/api/pipelines", listPipelines);
app.get("/api/pipelines/:pipelineId", getPipeline);
app.get("/api/pipelines/:pipelineId/config", pipelineInteractBuilder(getPipelineFromRequest), getPipelineConfig);
app.post("/api/pipelines/:pipelineId/config", pipelineInteractBuilder(getPipelineFromRequest), setPipelineConfig);

// Build routes.
app.get("/api/runs/:pipelineId/:runId/log", pipelineInspectBuilder(getPipelineFromRequest), getPipelineLog);
app.get("/api/runs/:pipelineId/:runId/archived", pipelineInspectBuilder(getPipelineFromRequest), getPipelineArchive);

// Trigger routes.
app.post("/trigger/:token", pipelineInteractBuilder(getPipelineFromRequest), trigger);
app.post("/trigger/:token/github", pipelineInteractBuilder(getPipelineFromRequest), triggerWithGitHub);

export default app;