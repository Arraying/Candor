import app from "./app";
import { mainMenuLoop } from "./menu";
import { AppDataSource } from "./data-source";

// Make it possible to not run the CLI i.e. for development purposes.
const WEB_ONLY = process.env.WEB_ONLY || false;

// Initialize the database as the first thing.
AppDataSource.initialize()
    .then(async () => {
        // Serve the web server.
        const server = app.listen(parseInt(process.env.DASHBOARD_PORT || "3000"));
        // Run the command-line tool.
        if (WEB_ONLY != "true") {
            mainMenuLoop()
                // When this exits, the server should be killed too.
                .then(() => {
                    server.close();
                })
                // Generic error handling.
                .catch((error) => {
                    console.error(error);
                });
        }

    })
    .catch((e) => {
        console.error("Could not setup database.");
        console.error(e);
    });
