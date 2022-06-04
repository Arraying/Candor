import express from "express";
import { cli } from "./cli";
import { AppDataSource } from "./data-source";

// Initialize the database as the first thing.
AppDataSource.initialize()
    .then(async () => {
        // Run the command-line tool.
        cli();
    })
    .catch((e) => {
        console.error("Could not setup database.");
        console.error(e);
    });
