module.exports = class CreateUsersTable1654350937441 {
    async up(queryRunner) {
        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS "users" (
                "id" serial PRIMARY KEY,
                "name" varchar(64) UNIQUE NOT NULL,
                "token_hash" varchar(128) NOT NULL
            );
        `);
    }

    async down(queryRunner) {
        await queryRunner.query("DROP TABLE \"users\";");
    }
}
