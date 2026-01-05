import { Sequelize } from 'sequelize-typescript';
import { Kondo } from '../src/kondo/entities/kondo.entity';
import { Media } from '../src/media/entities/media.entity';
import { Like } from '../src/like/entities/like.entity';
import { Unit } from '../src/unit/entities/unit.entity';
import { User } from '../src/user/entities/user.entity';
import * as dotenv from 'dotenv';
import { exec } from 'child_process';
import { promisify } from 'util';
import getDbConfig from '../src/database/config';

const execAsync = promisify(exec);

// Load environment variables
dotenv.config();

interface SyncStats {
  kondos: { inserted: number; updated: number; skipped: number };
  media: { inserted: number; updated: number; skipped: number };
}

interface DbConfig {
  dialect: 'postgres';
  host: string;
  port: number;
  username: string;
  password: string;
  database: string;
  url?: string;
  dialectOptions?: {
    ssl?: {
      require: boolean;
      rejectUnauthorized: boolean;
    };
  };
  logging?: boolean;
}

class KondoSyncService {
  private localDB!: Sequelize;
  private prodDB!: Sequelize;
  private stats: SyncStats = {
    kondos: { inserted: 0, updated: 0, skipped: 0 },
    media: { inserted: 0, updated: 0, skipped: 0 },
  };

  /**
   * Run migrations on production database
   */
  async runProductionMigrations(): Promise<void> {
    console.log('📋 Step 1: Running production migrations...');
    try {
      const { stdout, stderr } = await execAsync('NODE_ENV=production npx sequelize-cli db:migrate');
      if (stderr && !stderr.includes('Sequelize CLI')) {
        console.warn('Migration warnings:', stderr);
      }
      console.log('✓ Migrations complete\n');
    } catch (error: any) {
      console.log('⚠ Migration status:', error.stdout || error.message);
      console.log('✓ Continuing with sync...\n');
    }
  }

  /**
   * Connect to local database
   */
  async connectLocal(): Promise<Sequelize> {
    console.log('📋 Step 2: Connecting to databases...');
    
    // Set NODE_ENV temporarily to get development config
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'development';
    
    const dbConfig = getDbConfig();
    
    // Restore NODE_ENV
    process.env.NODE_ENV = originalEnv;
    
    // Create Sequelize instance (same pattern as database.dropAll.ts)
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
    
    await sequelize.authenticate();
    return sequelize;
  }

  /**
   * Connect to production database
   */
  async connectProduction(): Promise<Sequelize> {
    // Use RENDER_EXTERNAL_URL for external connections (has full hostname)
    const productionUrl = process.env.RENDER_EXTERNAL_URL || process.env.DATABASE_URL;
    
    if (!productionUrl) {
      throw new Error('RENDER_EXTERNAL_URL or DATABASE_URL must be set for production connection');
    }
    
    // Debug: Show what we're connecting to
    console.log('🔍 Production connection:');
    console.log(`  - Using: ${productionUrl.includes('oregon-postgres.render.com') ? 'RENDER_EXTERNAL_URL' : 'DATABASE_URL'}`);
    console.log(`  - Host: ${productionUrl.split('@')[1]?.split('/')[0] || 'N/A'}`);
    
    // Create Sequelize instance with SSL for production
    const sequelize = new Sequelize(productionUrl, {
      dialect: 'postgres',
      dialectOptions: {
        ssl: {
          require: true,
          rejectUnauthorized: false,
        },
      },
      models: [Kondo, Media, Like, Unit, User],
      logging: false,
    } as any);
    
    await sequelize.authenticate();
    return sequelize;
  }

  /**
   * Compare if two Kondos are equal (excluding id, timestamps)
   */
  areKondosEqual(localKondo: any, prodKondo: any): boolean {
    const fieldsToCompare = [
      'name', 'active', 'status', 'highlight', 'slug', 'featured_image', 'type', 'description',
      'minutes_from_bh', 'cep', 'address_street_and_numbers', 'neighborhood', 'city',
      'lot_avg_price', 'condo_rent', 'lots_available', 'lots_min_size', 'finance',
      'finance_tranches', 'finance_fees', 'entry_value_percentage', 'infra_description',
      'infra_lobby_24h', 'infra_security_team', 'infra_wall', 'infra_sports_court',
      'infra_barbecue_zone', 'infra_pool', 'infra_living_space', 'infra_pet_area',
      'infra_kids_area', 'infra_lagoon', 'infra_eletricity', 'infra_water',
      'infra_sidewalks', 'infra_internet', 'infra_generates_power', 'infra_grass_area',
      'infra_woods', 'infra_vegetable_garden', 'infra_nature_trail', 'infra_gourmet_area',
      'infra_parking_lot', 'infra_heliport', 'infra_gym', 'infra_gardens',
      'infra_interactive_lobby', 'infra_home_office', 'infra_lounge_bar',
      'infra_party_saloon', 'infra_market_nearby', 'total_area', 'immediate_delivery',
      'delivery', 'url', 'phone', 'email', 'video',
      'scraped_raw_data', 'scraped_data_source', 'scraped_extraction_method',
      'scraped_extraction_confidence', 'scraped_at', 'ai_composed', 'ai_composed_at',
      'kondo_data_updated', 'kondo_data_content_quality', 'kondo_data_media_quality',
    ];

    return fieldsToCompare.every((field) => {
      const localVal = localKondo[field];
      const prodVal = prodKondo[field];
      
      // Handle null/undefined/empty string equivalence
      if ((localVal == null || localVal === '') && (prodVal == null || prodVal === '')) {
        return true;
      }
      
      return String(localVal) === String(prodVal);
    });
  }

  /**
   * Compare if two Media objects are equal
   */
  areMediaEqual(localMedia: any, prodMedia: any): boolean {
    const fields = ['filename', 'type', 'status', 'storage_url'];
    return fields.every((field) => {
      const localVal = localMedia[field];
      const prodVal = prodMedia[field];
      
      if ((localVal == null || localVal === '') && (prodVal == null || prodVal === '')) {
        return true;
      }
      
      return String(localVal) === String(prodVal);
    });
  }

  /**
   * Insert a new Kondo with its Media into production
   */
  async insertKondo(kondo: any): Promise<void> {
    const ProdKondo = this.prodDB.model('Kondo') as typeof Kondo;
    const ProdMedia = this.prodDB.model('Media') as typeof Media;

    // Prepare Kondo data (exclude id, let DB generate)
    const kondoData: any = kondo.get({ plain: true });
    delete kondoData.id;
    delete kondoData.medias;
    delete kondoData.likes;
    
    // Insert Kondo
    const newKondo = await ProdKondo.create(kondoData);
    
    // Insert related Media
    if (kondo.medias && kondo.medias.length > 0) {
      for (const media of kondo.medias) {
        const mediaData: any = media.get({ plain: true });
        delete mediaData.id;
        mediaData.kondoId = newKondo.id; // Use new production ID
        delete mediaData.unitId; // We're only syncing Kondo-related media
        
        await ProdMedia.create(mediaData);
        this.stats.media.inserted++;
      }
    }
  }

  /**
   * Update an existing Kondo in production
   */
  async updateKondo(localKondo: any, prodKondoId: number): Promise<void> {
    const ProdKondo = this.prodDB.model('Kondo') as typeof Kondo;

    const kondoData: any = localKondo.get({ plain: true });
    delete kondoData.id;
    delete kondoData.createdAt;
    delete kondoData.updatedAt;
    delete kondoData.medias;
    delete kondoData.likes;

    await ProdKondo.update(kondoData, {
      where: { id: prodKondoId },
    });
  }

  /**
   * Sync Media for a specific Kondo
   */
  async syncMedia(localMedia: any[], prodMedia: any[], prodKondoId: number): Promise<void> {
    const ProdMedia = this.prodDB.model('Media') as typeof Media;

    // Create a map of production media by filename for quick lookup
    const prodMediaMap = new Map(
      prodMedia
        .filter(m => m.kondoId === prodKondoId) // Only media for this Kondo
        .map((m) => [m.filename, m])
    );

    for (const localMediaItem of localMedia) {
      const prodMediaItem = prodMediaMap.get(localMediaItem.filename);

      if (!prodMediaItem) {
        // Insert new Media
        const mediaData: any = localMediaItem.get({ plain: true });
        delete mediaData.id;
        mediaData.kondoId = prodKondoId;
        delete mediaData.unitId; // We're only syncing Kondo-related media
        
        await ProdMedia.create(mediaData);
        this.stats.media.inserted++;
      } else {
        // Check if update needed
        if (!this.areMediaEqual(localMediaItem, prodMediaItem)) {
          const mediaData: any = localMediaItem.get({ plain: true });
          delete mediaData.id;
          delete mediaData.createdAt;
          delete mediaData.updatedAt;
          mediaData.kondoId = prodKondoId;
          delete mediaData.unitId;

          await ProdMedia.update(mediaData, {
            where: { id: prodMediaItem.id },
          });
          this.stats.media.updated++;
        } else {
          this.stats.media.skipped++;
        }
      }
    }
  }

  /**
   * Main sync process
   */
  async sync(): Promise<void> {
    console.log('🔄 Syncing Kondos from Local → Production');
    console.log('━'.repeat(50) + '\n');

    try {
      // Step 1: Run migrations
      await this.runProductionMigrations();

      // Step 2: Connect to databases
      this.localDB = await this.connectLocal();
      this.prodDB = await this.connectProduction();

      // Step 3: Fetch Kondos
      const LocalKondo = this.localDB.model('Kondo') as typeof Kondo;
      const ProdKondo = this.prodDB.model('Kondo') as typeof Kondo;

      const localKondos = await LocalKondo.findAll({
        include: [{ model: this.localDB.model('Media') as typeof Media, as: 'medias' }],
      });

      const prodKondos = await ProdKondo.findAll({
        include: [{ model: this.prodDB.model('Media') as typeof Media, as: 'medias' }],
      });

      console.log(`✓ Local DB connected (${localKondos.length} kondos found)`);
      console.log(`✓ Production DB connected (${prodKondos.length} kondos found)\n`);

      // Step 4: Create slug-based map for production
      const prodKondoMap = new Map(prodKondos.map((k) => [k.slug, k]));

      // Step 5: Process each local Kondo
      console.log('📋 Step 3: Syncing Kondos...');
      for (const localKondo of localKondos) {
        const prodKondo = prodKondoMap.get(localKondo.slug);

        if (!prodKondo) {
          // INSERT new Kondo + Media
          console.log(`  + ${localKondo.slug}: Inserted (new)`);
          await this.insertKondo(localKondo);
          this.stats.kondos.inserted++;
        } else {
          // UPDATE if different
          if (!this.areKondosEqual(localKondo, prodKondo)) {
            console.log(`  ✓ ${localKondo.slug}: Updated`);
            await this.updateKondo(localKondo, prodKondo.id);
            this.stats.kondos.updated++;
          } else {
            console.log(`  ⊘ ${localKondo.slug}: Skipped (no changes)`);
            this.stats.kondos.skipped++;
          }

          // Sync Media
          if (localKondo.medias && localKondo.medias.length > 0) {
            await this.syncMedia(localKondo.medias, prodKondo.medias || [], prodKondo.id);
          }
        }
      }

      // Step 6: Print summary
      console.log('\n📋 Step 4: Media sync complete\n');
      this.printSummary();

      // Close connections
      await this.localDB.close();
      await this.prodDB.close();

      console.log('✨ Sync complete!');
      process.exit(0);
    } catch (error: any) {
      console.error('\n❌ Error during sync:', error.message);
      if (error.stack) {
        console.error(error.stack);
      }
      
      // Attempt to close connections
      try {
        if (this.localDB) await this.localDB.close();
        if (this.prodDB) await this.prodDB.close();
      } catch (closeError) {
        // Ignore close errors
      }
      
      process.exit(1);
    }
  }

  /**
   * Print sync summary
   */
  printSummary(): void {
    console.log('━'.repeat(50));
    console.log('📊 Summary:');
    console.log(`  Kondos:  ${this.stats.kondos.inserted} inserted, ${this.stats.kondos.updated} updated, ${this.stats.kondos.skipped} skipped`);
    console.log(`  Media:   ${this.stats.media.inserted} inserted, ${this.stats.media.updated} updated, ${this.stats.media.skipped} skipped`);
    console.log('━'.repeat(50));
  }
}

// Run the sync
const syncService = new KondoSyncService();
syncService.sync();
