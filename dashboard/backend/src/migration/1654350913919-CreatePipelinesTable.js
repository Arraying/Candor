// eslint-disable-next-line
module.exports = class CreatePipelinesTable1654350913919 {
    async up(queryRunner) {
        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS "pipelines" (
                "id" serial PRIMARY KEY,
                "name" varchar(64) UNIQUE NOT NULL,
                "plan" json NOT NULL DEFAULT '{"stages":[]}'::json,
                "public" boolean NOT NULL DEFAULT false
            );
        `);
    }

    async down(queryRunner) {
        await queryRunner.query("DROP TABLE pipelines;");
    }
}
