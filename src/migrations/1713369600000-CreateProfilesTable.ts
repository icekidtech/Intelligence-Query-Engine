import { MigrationInterface, QueryRunner, Table, Index } from 'typeorm';

export class CreateProfilesTable1713369600000 implements MigrationInterface {
  name = '1713369600000-CreateProfilesTable';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'profiles',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
          },
          {
            name: 'name',
            type: 'varchar',
            length: '255',
          },
          {
            name: 'name_lower',
            type: 'varchar',
            length: '255',
          },
          {
            name: 'gender',
            type: 'varchar',
            length: '10',
            isNullable: true,
          },
          {
            name: 'gender_probability',
            type: 'numeric',
            precision: 5,
            scale: 4,
            isNullable: true,
          },
          {
            name: 'sample_size',
            type: 'integer',
            isNullable: true,
          },
          {
            name: 'age',
            type: 'integer',
            isNullable: true,
          },
          {
            name: 'age_group',
            type: 'varchar',
            length: '20',
            isNullable: true,
          },
          {
            name: 'country_id',
            type: 'varchar',
            length: '3',
            isNullable: true,
          },
          {
            name: 'country_probability',
            type: 'numeric',
            precision: 5,
            scale: 4,
            isNullable: true,
          },
          {
            name: 'created_at',
            type: 'timestamp with time zone',
            default: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true
    );

    // Create unique index on name_lower for case-insensitive uniqueness
    await queryRunner.createIndex(
      'profiles',
      new (Index as any)('idx_name_lower', ['name_lower'], { unique: true })
    );

    // Create index on created_at for sorting
    await queryRunner.createIndex(
      'profiles',
      new (Index as any)('idx_created_at', ['created_at'])
    );

    // Create indexes for filtering
    await queryRunner.createIndex('profiles', new (Index as any)('idx_gender', ['gender']));
    await queryRunner.createIndex('profiles', new (Index as any)('idx_age_group', ['age_group']));
    await queryRunner.createIndex('profiles', new (Index as any)('idx_country_id', ['country_id']));
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('profiles');
    if (table) {
      await queryRunner.dropTable('profiles');
    }
  }
}
