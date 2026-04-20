import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddCountryNameColumn1713369600002 implements MigrationInterface {
  name = '1713369600002-AddCountryNameColumn';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'profiles',
      new TableColumn({
        name: 'country_name',
        type: 'varchar',
        length: '255',
        isNullable: true,
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('profiles', 'country_name');
  }
}
