import dotenv from "dotenv";
import path from "path";
import "reflect-metadata";
import { DataSource } from "typeorm";

// Load the environment variables.
dotenv.config();

// Specify where migrations reside.
const migrations = path.join(__dirname, "migration", "*.js");

/**
 * Create the data source.
 */
export const AppDataSource = new DataSource({
    type: "postgres",
    // Load credentials from environment, compatible with pg.
    host: process.env.PGHOST,
    port: parseInt(!process.env.PGPORT ? "5432" : process.env.PGPORT),
    username: process.env.PGUSER,
    password: process.env.PGPASSWORD,
    database: process.env.PGDATABASE,
    // Other settings.
    synchronize: true,
    logging: false,
    entities: [],
    migrations: [migrations],
    subscribers: [],
})
