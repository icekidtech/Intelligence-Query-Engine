import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class UpdateCountryIdFormat1713369600001 implements MigrationInterface {
  name = '1713369600001-UpdateCountryIdFormat';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create a mapping of 3-char to 2-char country codes for any existing data
    const countryMapping: { [key: string]: string } = {
      'NGA': 'NG', // Nigeria
      'KEN': 'KE', // Kenya
      'TZA': 'TZ', // Tanzania
      'AGO': 'AO', // Angola
      'BEN': 'BJ', // Benin
      'BWA': 'BW', // Botswana
      'BFA': 'BF', // Burkina Faso
      'BDI': 'BI', // Burundi
      'CMR': 'CM', // Cameroon
      'CPV': 'CV', // Cape Verde
      'CAF': 'CF', // Central African Republic
      'TCD': 'TD', // Chad
      'COM': 'KM', // Comoros
      'COG': 'CG', // Congo
      'COD': 'CD', // Democratic Republic of Congo
      'CIV': 'CI', // Côte d'Ivoire
      'DJI': 'DJ', // Djibouti
      'EGY': 'EG', // Egypt
      'GNQ': 'GQ', // Equatorial Guinea
      'ERI': 'ER', // Eritrea
      'ETH': 'ET', // Ethiopia
      'GAB': 'GA', // Gabon
      'GMB': 'GM', // Gambia
      'GHA': 'GH', // Ghana
      'GIN': 'GN', // Guinea
      'GNB': 'GW', // Guinea-Bissau
      'KIR': 'KI', // Kiribati
      'LSO': 'LS', // Lesotho
      'LBR': 'LR', // Liberia
      'LBY': 'LY', // Libya
      'MDG': 'MG', // Madagascar
      'MWI': 'MW', // Malawi
      'MLI': 'ML', // Mali
      'MRT': 'MR', // Mauritania
      'MUS': 'MU', // Mauritius
      'MAR': 'MA', // Morocco
      'MOZ': 'MZ', // Mozambique
      'NAM': 'NA', // Namibia
      'NER': 'NE', // Niger
      'RWA': 'RW', // Rwanda
      'STP': 'ST', // São Tomé and Príncipe
      'SEN': 'SN', // Senegal
      'SYC': 'SC', // Seychelles
      'SLE': 'SL', // Sierra Leone
      'SOM': 'SO', // Somalia
      'ZAF': 'ZA', // South Africa
      'SSD': 'SS', // South Sudan
      'SDN': 'SD', // Sudan
      'SWZ': 'SZ', // Eswatini
      'UGA': 'UG', // Uganda
      'ZMB': 'ZM', // Zambia
      'ZWE': 'ZW', // Zimbabwe
    };

    // Update existing records with proper 2-char codes
    for (const [threeCharCode, twoCharCode] of Object.entries(countryMapping)) {
      await queryRunner.query(
        `UPDATE profiles SET country_id = $1 WHERE country_id = $2`,
        [twoCharCode, threeCharCode]
      );
    }

    // Alter the column definition to limit length to 2 characters
    await queryRunner.changeColumn(
      'profiles',
      new TableColumn({
        name: 'country_id',
        type: 'varchar',
        length: '3',
        isNullable: true,
      }),
      new TableColumn({
        name: 'country_id',
        type: 'varchar',
        length: '2',
        isNullable: true,
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Revert the column back to varchar(3) in case of rollback
    await queryRunner.changeColumn(
      'profiles',
      new TableColumn({
        name: 'country_id',
        type: 'varchar',
        length: '2',
        isNullable: true,
      }),
      new TableColumn({
        name: 'country_id',
        type: 'varchar',
        length: '3',
        isNullable: true,
      })
    );
  }
}
