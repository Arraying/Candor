

module.exports = class CreateKeyColumn1654789884301 {
    async up(queryRunner) {
        queryRunner.query(`
            ALTER TABLE "pipelines" ADD COLUMN "token" varchar(64) UNIQUE NOT NULL;
        `);
    }

    async down(queryRunner) {
        queryRunner.query(`
            ALTER TABLE "pipelines" DROP COLUMN "token";
        `);
    }
}
