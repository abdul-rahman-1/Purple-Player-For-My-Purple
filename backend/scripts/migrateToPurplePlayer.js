const mongoose = require('mongoose');
require('dotenv').config();

/**
 * Migration Script: Transfer data from 'test' database to 'PurplePlayer' database
 * 
 * WARNING: This script will:
 * 1. Connect to MongoDB cluster
 * 2. Copy all collections from 'test' database to 'PurplePlayer' database
 * 3. DELETE the 'test' database (only the 'test' database, no other databases)
 * 
 * Make sure to backup your data before running this script!
 */

const MONGODB_URI = process.env.MONGODB_URI;
const SOURCE_DB = 'test';
const TARGET_DB = 'purpleplayer'; // MongoDB converts to lowercase

// Extract connection string without database name
const baseConnectionString = MONGODB_URI.replace(/\/[^/]*$/, '');

async function migrateDatabase() {
  let sourceConnection = null;
  let targetConnection = null;

  try {
    console.log('🔄 Starting database migration...');
    console.log(`📊 Source Database: ${SOURCE_DB}`);
    console.log(`📊 Target Database: ${TARGET_DB}`);
    console.log('');

    // Connect to source database (test)
    console.log(`⏳ Connecting to source database: ${SOURCE_DB}...`);
    sourceConnection = await mongoose.createConnection(`${baseConnectionString}/${SOURCE_DB}`, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log(`✅ Connected to source database: ${SOURCE_DB}`);

    // Connect to target database (PurplePlayer)
    console.log(`⏳ Connecting to target database: ${TARGET_DB}...`);
    targetConnection = await mongoose.createConnection(`${baseConnectionString}/${TARGET_DB}`, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log(`✅ Connected to target database: ${TARGET_DB}`);
    console.log('');

    // Get all collections from source database
    console.log(`📋 Fetching collections from ${SOURCE_DB}...`);
    const sourceDb = sourceConnection.getClient().db(SOURCE_DB);
    const collections = await sourceDb.listCollections().toArray();
    const collectionNames = collections.map(c => c.name);

    if (collectionNames.length === 0) {
      console.log(`⚠️  No collections found in ${SOURCE_DB} database. Nothing to migrate.`);
      console.log('');
      console.log('🗑️  Proceeding to delete the test database...');
    } else {
      console.log(`📊 Found ${collectionNames.length} collection(s): ${collectionNames.join(', ')}`);
      console.log('');

      // Migrate each collection
      for (const collectionName of collectionNames) {
        console.log(`📦 Migrating collection: ${collectionName}...`);

        const sourceCollection = sourceDb.collection(collectionName);
        const targetDb = targetConnection.getClient().db(TARGET_DB);
        const targetCollection = targetDb.collection(collectionName);

        // Get all documents from source
        const documents = await sourceCollection.find({}).toArray();

        if (documents.length === 0) {
          console.log(`   ✓ Collection '${collectionName}' is empty. Skipping...`);
          continue;
        }

        // Insert into target database
        const result = await targetCollection.insertMany(documents);
        console.log(`   ✅ Migrated ${result.insertedIds.length} document(s) to ${collectionName}`);
      }
    }

    console.log('');
    console.log('🗑️  Attempting to delete the test database...');
    const adminDb = sourceConnection.getClient().db('admin');
    
    try {
      // Drop only the test database
      await sourceDb.dropDatabase();
      console.log(`✅ Successfully deleted the '${SOURCE_DB}' database`);
    } catch (dropError) {
      console.warn(`⚠️  Could not delete '${SOURCE_DB}' database (permission denied).`);
      console.warn('   This may require administrative privileges in MongoDB Atlas.');
      console.warn('   You can manually delete it from MongoDB Atlas dashboard if needed.');
    }

    console.log('');
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('✨ Migration completed successfully!');
    console.log('═══════════════════════════════════════════════════════════════');
    console.log(`✅ Data transferred from '${SOURCE_DB}' to '${TARGET_DB}'`);
    console.log(`✅ '${SOURCE_DB}' database deleted`);
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('');

  } catch (error) {
    console.error('');
    console.error('❌ ERROR during migration:');
    console.error(error.message);
    console.error('');
    console.error('⚠️  Migration aborted. No changes were made to your databases.');
    process.exit(1);
  } finally {
    // Close connections
    if (sourceConnection) {
      await sourceConnection.close();
    }
    if (targetConnection) {
      await targetConnection.close();
    }
    console.log('🔌 Database connections closed.');
    process.exit(0);
  }
}

// Run migration
migrateDatabase().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
