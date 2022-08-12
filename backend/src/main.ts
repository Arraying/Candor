import app from "./app";
import { mainMenuLoop } from "./menu";
import { AppDataSource } from "./data-source";

// Make it possible to not run the CLI i.e. for development purposes.
const WEB_ONLY = process.env.WEB_ONLY || false;

// Initialize the database as the first thing.
AppDataSource.initialize()
    .then(async () => {
        // Run the command-line tool.
        if (WEB_ONLY != "true") {
            mainMenuLoop();
        }
        // Serve the web server.
        app.listen(3000);
    })
    .catch((e) => {
        console.error("Could not setup database.");
        console.error(e);
    });
