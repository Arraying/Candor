module.exports = class CreateSessionsTable1654792362016 {
    async up(queryRunner) {
        queryRunner.query(`
            CREATE TABLE IF NOT EXISTS "sessions" (
                "sid" varchar(36) NOT NULL COLLATE "default" PRIMARY KEY,
                "sess" json NOT NULL,
                "expire" timestamp(6) NOT NULL
            );
        `);
        queryRunner.query(`
            CREATE INDEX "IDX_sessions_expire" ON "sessions" ("expire");
        `);
    }

    async down(queryRunner) {
        queryRunner.query(`
            DROP TABLE "sessions";
        `);
    }
}
