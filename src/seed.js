// Seed script to populate the database with sample centres and tests.
// Run this once before testing: node src/seed.js

const { sequelize, Centre, Test } = require('./models');

async function seed() {
  try {
    await sequelize.authenticate();
    console.log('Connected to database.');

    // Sync tables without dropping existing data
    await sequelize.sync();

    // Create diagnostic centres
    const [apollo] = await Centre.findOrCreate({
      where: { name: 'Apollo Diagnostics' },
      defaults: { location: 'Connaught Place, New Delhi' }
    });

    const [thyrocare] = await Centre.findOrCreate({
      where: { name: 'Thyrocare' },
      defaults: { location: 'Andheri West, Mumbai' }
    });

    const [lal] = await Centre.findOrCreate({
      where: { name: 'Lal PathLabs' },
      defaults: { location: 'Rohini, New Delhi' }
    });

    console.log('Centres created.');

    // Create tests for Apollo
    await Test.findOrCreate({
      where: { name: 'Complete Blood Count (CBC)', centre_id: apollo.id },
      defaults: { price: 350.00, centre_id: apollo.id }
    });
    await Test.findOrCreate({
      where: { name: 'Lipid Profile', centre_id: apollo.id },
      defaults: { price: 750.00, centre_id: apollo.id }
    });
    await Test.findOrCreate({
      where: { name: 'Blood Glucose Fasting', centre_id: apollo.id },
      defaults: { price: 200.00, centre_id: apollo.id }
    });

    // Create tests for Thyrocare
    await Test.findOrCreate({
      where: { name: 'Thyroid Profile (T3, T4, TSH)', centre_id: thyrocare.id },
      defaults: { price: 550.00, centre_id: thyrocare.id }
    });
    await Test.findOrCreate({
      where: { name: 'Vitamin D Test', centre_id: thyrocare.id },
      defaults: { price: 1200.00, centre_id: thyrocare.id }
    });

    // Create tests for Lal PathLabs
    await Test.findOrCreate({
      where: { name: 'HbA1c (Diabetes)', centre_id: lal.id },
      defaults: { price: 600.00, centre_id: lal.id }
    });
    await Test.findOrCreate({
      where: { name: 'Liver Function Test (LFT)', centre_id: lal.id },
      defaults: { price: 900.00, centre_id: lal.id }
    });

    console.log('Tests created.');
    console.log('\nSeed complete! You can now test the API.');
    console.log('  GET /centres        — 3 centres');
    console.log('  GET /centres/1/tests — 3 tests for Apollo');

  } catch (error) {
    console.error('Seeding failed:', error.message);
  } finally {
    await sequelize.close();
  }
}

seed();
