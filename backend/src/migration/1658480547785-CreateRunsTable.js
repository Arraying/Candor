module.exports = class CreateRunsTable1658480547785 {
    async up(queryRunner) {
        queryRunner.query(`
            CREATE TABLE IF NOT EXISTS "runs" (
                "id" serial PRIMARY KEY,
                "run_id" varchar(35) UNIQUE,
                "runner" int,
                "start" bigint NOT NULL,
                "finish" bigint NOT NULL,
                "outcome" json NOT NULL,
                CONSTRAINT "fk_runner"
                    FOREIGN KEY ("runner") 
                    REFERENCES "runners"("id")
                    ON DELETE SET NULL
            );
        `);
    }

    async down(queryRunner) {
        queryRunner.query(`
            DROP TABLE "runs";
        `);
    }
}
