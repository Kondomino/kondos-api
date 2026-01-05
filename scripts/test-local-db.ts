import { Sequelize } from 'sequelize-typescript';
import { Kondo } from '../src/kondo/entities/kondo.entity';
import { Media } from '../src/media/entities/media.entity';
import { Like } from '../src/like/entities/like.entity';
import { Unit } from '../src/unit/entities/unit.entity';
import { User } from '../src/user/entities/user.entity';
import * as dotenv from 'dotenv';
import getDbConfig from '../src/database/config';

// Load environment variables
dotenv.config();

async function testLocalConnection() {
  console.log('🧪 Testing Local Database Connection\n');
  console.log('━'.repeat(50));
  
  try {
    // Set NODE_ENV to development
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'development';
    
    const dbConfig = getDbConfig();
    
    // Restore NODE_ENV
    process.env.NODE_ENV = originalEnv;
    
    console.log('📋 Database Config:');
    console.log(`  - Database: ${dbConfig.database}`);
    console.log(`  - Host: ${dbConfig.host}`);
    console.log(`  - Port: ${dbConfig.port}`);
    console.log(`  - Username: ${dbConfig.username}`);
    console.log(`  - Dialect: ${dbConfig.dialect}`);
    console.log(`  - Using URL: ${dbConfig.url ? 'Yes' : 'No'}`);
    console.log('');
    
    // Create Sequelize instance
    const sequelize = dbConfig.url
      ? new Sequelize(dbConfig.url, { 
          ...dbConfig, 
          models: [Kondo, Media, Like, Unit, User],
          logging: false,
        } as any)
      : new Sequelize(dbConfig.database, dbConfig.username as string, dbConfig.password as string, {
          ...dbConfig,
          models: [Kondo, Media, Like, Unit, User],
          logging: false,
        } as any);
    
    console.log('🔌 Connecting to database...');
    await sequelize.authenticate();
    console.log('✓ Connected successfully\n');
    
    // Get model
    const KondoModel = sequelize.model('Kondo') as typeof Kondo;
    
    // Count total kondos
    console.log('📊 Counting Kondos...');
    const totalCount = await KondoModel.count();
    console.log(`✓ Total Kondos in database: ${totalCount}\n`);
    
    if (totalCount > 0) {
      // Fetch first kondo
      console.log('🔍 Fetching first Kondo...');
      const firstKondo = await KondoModel.findOne({
        include: [{ model: sequelize.model('Media') as typeof Media, as: 'medias' }]
      });
      
      if (firstKondo) {
        console.log('✓ First Kondo found:');
        console.log(`  - ID: ${firstKondo.id}`);
        console.log(`  - Name: ${firstKondo.name}`);
        console.log(`  - Slug: ${firstKondo.slug}`);
        console.log(`  - Status: ${firstKondo.status}`);
        console.log(`  - Type: ${firstKondo.type}`);
        console.log(`  - City: ${firstKondo.city || 'N/A'}`);
        console.log(`  - Active: ${firstKondo.active}`);
        console.log(`  - Media count: ${firstKondo.medias?.length || 0}`);
        console.log('');
      }
      
      // Fetch a random kondo
      console.log('🎲 Fetching random Kondo...');
      const randomKondo = await KondoModel.findOne({
        order: sequelize.random(),
        include: [{ model: sequelize.model('Media') as typeof Media, as: 'medias' }]
      });
      
      if (randomKondo) {
        console.log('✓ Random Kondo found:');
        console.log(`  - ID: ${randomKondo.id}`);
        console.log(`  - Name: ${randomKondo.name}`);
        console.log(`  - Slug: ${randomKondo.slug}`);
        console.log(`  - Media count: ${randomKondo.medias?.length || 0}`);
        console.log('');
      }
    } else {
      console.log('⚠️  No Kondos found in database!');
      console.log('');
    }
    
    // Close connection
    await sequelize.close();
    
    console.log('━'.repeat(50));
    console.log('✅ Test Complete!');
    process.exit(0);
    
  } catch (error: any) {
    console.error('\n❌ Error:', error.message);
    if (error.stack) {
      console.error(error.stack);
    }
    process.exit(1);
  }
}

testLocalConnection();
