import { AppDataSource } from '../database';
import { loadSeedProfiles, validateSeedProfile, getSeedFilePath } from '../utils/seed.utils';
import { profileRepository } from '../repositories/ProfileRepository';

/**
 * Seed database with profiles from seed_profiles.json
 */
async function seedDatabase() {
  try {
    console.log('Starting database seeding...');

    // Initialize database connection
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
    }

    // Load seed data
    const seedFilePath = getSeedFilePath();
    console.log(`Loading seed data from: ${seedFilePath}`);

    const seedProfiles = loadSeedProfiles(seedFilePath);
    console.log(`Loaded ${seedProfiles.length} profiles from seed file`);

    if (seedProfiles.length === 0) {
      console.error('No profiles found in seed file');
      process.exit(1);
    }

    // Validate and seed
    let validCount = 0;
    const profilesToSeed = [];

    for (const profile of seedProfiles) {
      if (validateSeedProfile(profile)) {
        profilesToSeed.push(profile);
        validCount++;
      }
    }

    console.log(`Validated ${validCount}/${seedProfiles.length} profiles`);

    // Seed profiles
    const result = await profileRepository.seedProfiles(profilesToSeed);

    console.log(`\n📈 Seeding Results:`);
    console.log(`   ✨ Inserted: ${result.inserted}`);
    console.log(`   ⏭️  Skipped (duplicates): ${result.skipped}`);
    if (result.errors.length > 0) {
      console.log(`   ❌ Errors: ${result.errors.length}`);
      if (result.errors.length <= 5) {
        result.errors.forEach((err) => {
          console.log(`      - ${err.name}: ${err.error?.message || 'Unknown error'}`);
        });
      }
    }

    const totalProfiles = await profileRepository.count();
    console.log(`\nTotal profiles in database: ${totalProfiles}`);

    console.log('\nSeeding completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Seeding failed:', error);
    process.exit(1);
  }
}

// Run seeding
seedDatabase();
