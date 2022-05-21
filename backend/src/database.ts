import { Pool } from "pg";

const pool = new Pool();

/**
 * Sets up all the required tables.
 */
export async function setup(): Promise<void> {
    // Create the users table.
    await pool.query(`
        CREATE TABLE IF NOT EXISTS "users" (
            "id" serial PRIMARY KEY,
            "username" varchar(32) UNIQUE,
            "password" varchar(64),
            "permissions" int DEFAULT 0
        );
    `);
    // Create the pipelines table.
    await pool.query(`
        CREATE TABLE IF NOT EXISTS "pipelines" (
            "id" serial PRIMARY KEY,
            "name" varchar(64),
            "plan" json,
            "public_pipeline" boolean DEFAULT true,
            "public_archive" boolean DEFAULT true
        );
    `);
    // Create the runs table.
    await pool.query(`
        CREATE TABLE IF NOT EXISTS "runs" (
            "id" serial PRIMARY KEY,
            "pipeline" integer,
            "started" timestamp,
            "stopped" timestamp,
            "result" json,
            CONSTRAINT foreign_pipeline
                FOREIGN KEY ("pipeline")
                REFERENCES "pipelines" ("id")
                ON DELETE CASCADE
        );
    `);
}

/**
 * Create a new user.
 * @param name The name of the user.
 * @param password The password of the user.
 */
export async function createUser(name: string, password: string): Promise<void> {
    await pool.query('INSERT INTO "users" ("username", "password") VALUES ($1, $2);', [name, password]);
}