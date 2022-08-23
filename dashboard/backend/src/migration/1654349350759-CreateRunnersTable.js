module.exports = class CreateRunnersTable1654349350759 {
    async up(queryRunner) {
        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS "runners" (
                "id" serial PRIMARY KEY,
                "name" varchar(32) UNIQUE,
                "hostname" varchar(1024),
                "port" int
            );
        `);
    }

    async down(queryRunner) {
        await queryRunner.query("DROP TABLE \"runners\";");
    }
}
