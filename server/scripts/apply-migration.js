const fs = require('fs');
const path = require('path');
const db = require('../config/db');

const migrationName = process.argv[2];
const migrationsDirectory = path.join(__dirname, '../migrations');

const applyMigration = async () => {
  try {
    if (
      !migrationName ||
      path.basename(migrationName) !== migrationName ||
      !migrationName.endsWith('.sql')
    ) {
      throw new Error('Pass a migration SQL filename from the migrations directory.');
    }

    const migrationPath = path.join(migrationsDirectory, migrationName);
    const migration = fs.readFileSync(migrationPath, 'utf8');
    await db.query(migration);
    console.log(`Migration ${migrationName} applied successfully.`);
  } catch (error) {
    console.error('Failed to apply migration:', error.message);
    process.exitCode = 1;
  } finally {
    await db.pool.end();
  }
};

applyMigration();
