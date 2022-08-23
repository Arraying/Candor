// eslint-disable-next-line
module.exports = class CreateAssignmentsTable1654351001488 {
    async up(queryRunner) {
        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS "assignments" (
                "id" serial PRIMARY KEY,
                "user" int NOT NULL,
                "pipeline" int NOT NULL,
                CONSTRAINT "fk_user"
                    FOREIGN KEY ("user") 
                    REFERENCES "users"("id")
                    ON DELETE CASCADE,
                CONSTRAINT "fk_pipeline"
                    FOREIGN KEY ("pipeline")
                    REFERENCES "pipelines"("id")
                    ON DELETE CASCADE
            );
        `);
    }

    async down(queryRunner) {
        await queryRunner.query("DROP TABLE \"assignments\";");
    }
}
