import "reflect-metadata";
import { Assignment } from "./entities/Assignment";
import { DataSource } from "typeorm";
import dotenv from "dotenv";
import path from "path";
import { Pipeline } from "./entities/Pipeline";
import { Run } from "./entities/Run";
import { Runner } from "./entities/Runner";
import { User } from "./entities/User";

// Load the environment variables.
dotenv.config();

// Set defaults such that both connect-pg-simple and TypeORM can use the same ones.
if (!process.env.PGHOST) {
    process.env.PGHOST = "localhost";
}
if (!process.env.PGPORT) {
    process.env.PGPORT = "5432";
}
if (!process.env.PGUSER) {
    process.env.PGUSER = "candor";
}
if (!process.env.PGDATABASE) {
    process.env.PGDATABASE = "candor";
}

// Specify where migrations reside.
const migrations = path.join(__dirname, "migration", "*.js");

/**
 * Create the data source.
 */
export const AppDataSource = new DataSource({
    type: "postgres",
    // Load credentials from environment, compatible with pg.
    host: process.env.PGHOST,
    port: parseInt(process.env.PGPORT),
    username: process.env.PGUSER,
    password: process.env.PGPASSWORD,
    database: process.env.PGDATABASE,
    // Other settings.
    synchronize: false,
    logging: false,
    entities: [Runner, Pipeline, User, Assignment, Run],
    migrations: [migrations],
    subscribers: [],
})
