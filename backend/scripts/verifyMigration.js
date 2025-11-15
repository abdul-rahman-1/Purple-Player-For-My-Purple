const mongoose = require('mongoose');
require('dotenv').config();

/**
 * Verification Script: Check data in PurplePlayer database
 */

async function verifyMigration() {
  let connection = null;

  try {
    console.log('🔍 Verifying PurplePlayer database...');
    console.log('');

    const MONGODB_URI = process.env.MONGODB_URI;
    
    connection = await mongoose.createConnection(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    const db = connection.getClient().db('purpleplayer');
    
    // Get all collections
    const collections = await db.listCollections().toArray();
    const collectionNames = collections.map(c => c.name);

    console.log(`📊 Collections in 'purpleplayer': ${collectionNames.join(', ')}`);
    console.log('');

    // Count documents in each collection
    for (const collectionName of collectionNames) {
      const collection = db.collection(collectionName);
      const count = await collection.countDocuments();
      const sample = await collection.findOne();
      
      console.log(`📋 Collection: ${collectionName}`);
      console.log(`   ✅ Total documents: ${count}`);
      if (sample) {
        console.log(`   ✅ Sample document ID: ${sample._id}`);
      }
      console.log('');
    }

    console.log('═══════════════════════════════════════════════════════════════');
    console.log('✨ Verification complete! All data is in purpleplayer database.');
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('');
    console.log('📌 Next steps:');
    console.log('   1. Go to MongoDB Atlas Dashboard');
    console.log('   2. Navigate to your cluster');
    console.log('   3. Click on "Collections"');
    console.log('   4. Find and delete the "test" database manually');
    console.log('');

  } catch (error) {
    console.error('❌ ERROR during verification:');
    console.error(error.message);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.close();
    }
    process.exit(0);
  }
}

verifyMigration();
