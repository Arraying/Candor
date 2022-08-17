module.exports = class RemovePortColumn1660322670845 {
    async up(queryRunner) {
        queryRunner.query(`
            ALTER TABLE "runners" DROP COLUMN "port";
        `);
    }

    async down(queryRunner) {
        queryRunner.query(`
            ALTER TABLE "runners" ADD COLUMN "port" int;
        `);
    }
}
