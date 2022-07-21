import cors from "cors";
import express from "express";
import expressSession from "express-session";
import connectPgSimple from "connect-pg-simple";
import security from "./middleware/security";
import { login, logout, me } from "./routes/auth";
import { User } from "./entities/User";
import { listPipelines, getPipeline, getPipelineConfig, setPipelineConfig } from "./routes/pipelines";
import { trigger, triggerWithGitHub } from "./routes/trigger";

// Import the correct type definitions.
declare module 'express-session' {
    interface SessionData {
      user: User;
    }
}

// The path where all the static material is rendered.
// This is where Svelte should compile to.
const PUBLIC = process.env.PUBLIC || "../frontend/public";
// The cookie secret.
const COOKIE_SECRET = process.env.COOKIE_SECRET || "legends never die";

// Create the server.
const app = express();
// Create the session store.
const pgSessionStore = connectPgSimple(expressSession);

// Use static for the SPA.
app.use(express.static(PUBLIC));
// Use JSON for API.
app.use(express.json());
// Allow CORS.
app.use(cors({
    credentials: true,
    origin: process.env.ORIGIN
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
app.get("/api/pipelines/:pipelineId/config", getPipelineConfig);
app.post("/api/pipelines/:pipelineId/config", setPipelineConfig);

// Trigger routes.
app.post("/trigger/:token", trigger);
app.post("/trigger/:token/github", triggerWithGitHub);

export default app;