import app from "./app";
import { AppDataSource } from "./data-source";
import { logger } from "./logger";
import { mainMenuLoop } from "./menu";
import { Server } from "http";

// Make it possible to not run the CLI i.e. for development purposes.
const WEB_ONLY = process.env.WEB_ONLY || false;

// Keep a reference to app so it can be shutdown hooked.
let server: Server;

// Handle ^C and SIGTERM properly.
const shutdown = () => {
    console.log("Shutting down.");
    if (server) {
        server.close();
    }
    process.exit(0);
}
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

// Initialize the database as the first thing.
AppDataSource.initialize()
    .then(async () => {
        // Serve the web server.
        server = app.listen(parseInt(process.env.DASHBOARD_PORT || "3000"));
        // Run the command-line tool.
        if (WEB_ONLY !== "true") {
            mainMenuLoop()
                // When this exits, the server should be killed too.
                .then(() => {
                    shutdown();
                })
                // Generic error handling.
                .catch((error) => {
                    logger.error(error);
                });
        }

    })
    .catch((error) => {
        logger.error("Could not setup database.");
        logger.error(error);
    });
