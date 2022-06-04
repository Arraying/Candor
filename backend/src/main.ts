import dotenv from "dotenv";
import express from "express";
import { cli } from "./cli";
import { setup } from "./database";
import { makeAdmin } from "./routes/admin";

// Load the environment variables.
dotenv.config();

cli();

// // Setup the database.
// setup().then(() => {
//     // Create the Express app.
//     const app = express();

//     // Use JSON middleware to handle JSON requests in bodies.
//     app.use(express.json());

//     // Route to make an admin user.
//     app.post("/makeadmin", makeAdmin);
    
//     // Listen on the correct port.
//     app.listen(process.env.BACKEND_PORT);
// });
