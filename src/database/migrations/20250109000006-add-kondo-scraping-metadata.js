module.exports = {
  up: async (queryInterface, Sequelize) => {
    try {
      console.log('Starting migration: Adding Kondo scraping metadata fields...');

      // Check if Kondos table exists
      const tables = await queryInterface.showAllTables();
      const kondosTableExists = tables.includes('Kondos') || tables.includes('kondos');
      
      if (!kondosTableExists) {
        console.log('⚠️  Kondos table does not exist. Skipping migration.');
        return;
      }

      // Get existing columns
      const tableDescription = await queryInterface.describeTable('Kondos');
      console.log('Existing Kondos columns:', Object.keys(tableDescription));

      // Add scraped_raw_data column (JSONB for storing window.aldeaData, __NEXT_DATA__, etc.)
      if (!tableDescription.scraped_raw_data) {
        console.log('Adding scraped_raw_data column...');
        await queryInterface.addColumn('Kondos', 'scraped_raw_data', {
          type: Sequelize.JSONB,
          allowNull: true,
          comment: 'Raw scraped data (window.aldeaData, __NEXT_DATA__, etc.) for future AI processing'
        });
        console.log('✓ scraped_raw_data column added');
      } else {
        console.log('⊘ scraped_raw_data column already exists, skipping');
      }

      // Add scraped_data_source column (e.g., "window.aldeaData")
      if (!tableDescription.scraped_data_source) {
        console.log('Adding scraped_data_source column...');
        await queryInterface.addColumn('Kondos', 'scraped_data_source', {
          type: Sequelize.TEXT,
          allowNull: true,
          comment: 'Source variable name of extracted data (e.g., "window.aldeaData", "__NEXT_DATA__")'
        });
        console.log('✓ scraped_data_source column added');
      } else {
        console.log('⊘ scraped_data_source column already exists, skipping');
      }

      // Add scraped_extraction_method column (ENUM: 'manual' or 'js-rendered')
      if (!tableDescription.scraped_extraction_method) {
        console.log('Adding scraped_extraction_method column...');
        
        // Create ENUM type if it doesn't exist
        await queryInterface.sequelize.query(
          `CREATE TYPE "enum_Kondos_scraped_extraction_method" AS ENUM ('manual', 'js-rendered');`,
          { raw: true }
        ).catch(err => {
          // Ignore error if type already exists
          if (!err.message.includes('already exists')) {
            throw err;
          }
          console.log('⊘ ENUM type already exists, continuing...');
        });
        
        // Add the column with the ENUM type
        await queryInterface.addColumn('Kondos', 'scraped_extraction_method', {
          type: '"enum_Kondos_scraped_extraction_method"',
          allowNull: true
        });
        
        // Add comment separately
        await queryInterface.sequelize.query(
          `COMMENT ON COLUMN "Kondos"."scraped_extraction_method" IS 'Extraction method used: manual (Phase 1, no JS) or js-rendered (Phase 2, with JS)';`
        );
        
        console.log('✓ scraped_extraction_method column added');
      } else {
        console.log('⊘ scraped_extraction_method column already exists, skipping');
      }

      // Add scraped_extraction_confidence column (0.00 to 1.00)
      if (!tableDescription.scraped_extraction_confidence) {
        console.log('Adding scraped_extraction_confidence column...');
        await queryInterface.addColumn('Kondos', 'scraped_extraction_confidence', {
          type: Sequelize.DECIMAL(3, 2),
          allowNull: true,
          comment: 'Confidence score of extraction (0.00 to 1.00)',
          validate: {
            min: 0,
            max: 1
          }
        });
        console.log('✓ scraped_extraction_confidence column added');
      } else {
        console.log('⊘ scraped_extraction_confidence column already exists, skipping');
      }

      // Add scraped_at column (timestamp of scraping)
      if (!tableDescription.scraped_at) {
        console.log('Adding scraped_at column...');
        await queryInterface.addColumn('Kondos', 'scraped_at', {
          type: Sequelize.DATE,
          allowNull: true,
          comment: 'Timestamp when the property was last scraped'
        });
        console.log('✓ scraped_at column added');
      } else {
        console.log('⊘ scraped_at column already exists, skipping');
      }

      // Add ai_composed column (flag for AI Composer processing)
      if (!tableDescription.ai_composed) {
        console.log('Adding ai_composed column...');
        await queryInterface.addColumn('Kondos', 'ai_composed', {
          type: Sequelize.BOOLEAN,
          defaultValue: false,
          allowNull: false,
          comment: 'Flag indicating if AI Composer has processed this property'
        });
        console.log('✓ ai_composed column added');
      } else {
        console.log('⊘ ai_composed column already exists, skipping');
      }

      // Add ai_composed_at column (timestamp of AI processing)
      if (!tableDescription.ai_composed_at) {
        console.log('Adding ai_composed_at column...');
        await queryInterface.addColumn('Kondos', 'ai_composed_at', {
          type: Sequelize.DATE,
          allowNull: true,
          comment: 'Timestamp when AI Composer processed this property'
        });
        console.log('✓ ai_composed_at column added');
      } else {
        console.log('⊘ ai_composed_at column already exists, skipping');
      }

      console.log('✓ Migration completed successfully: All scraping metadata fields added to Kondos table');

    } catch (error) {
      console.error('❌ Migration failed:', error.message);
      console.error('Stack trace:', error.stack);
      throw error;
    }
  },

  down: async (queryInterface, Sequelize) => {
    try {
      console.log('Starting rollback: Removing Kondo scraping metadata fields...');

      // Check if Kondos table exists
      const tables = await queryInterface.showAllTables();
      const kondosTableExists = tables.includes('Kondos') || tables.includes('kondos');
      
      if (!kondosTableExists) {
        console.log('⚠️  Kondos table does not exist. Nothing to rollback.');
        return;
      }

      // Get existing columns
      const tableDescription = await queryInterface.describeTable('Kondos');

      // Remove columns in reverse order
      if (tableDescription.ai_composed_at) {
        console.log('Removing ai_composed_at column...');
        await queryInterface.removeColumn('Kondos', 'ai_composed_at');
        console.log('✓ ai_composed_at column removed');
      }

      if (tableDescription.ai_composed) {
        console.log('Removing ai_composed column...');
        await queryInterface.removeColumn('Kondos', 'ai_composed');
        console.log('✓ ai_composed column removed');
      }

      if (tableDescription.scraped_at) {
        console.log('Removing scraped_at column...');
        await queryInterface.removeColumn('Kondos', 'scraped_at');
        console.log('✓ scraped_at column removed');
      }

      if (tableDescription.scraped_extraction_confidence) {
        console.log('Removing scraped_extraction_confidence column...');
        await queryInterface.removeColumn('Kondos', 'scraped_extraction_confidence');
        console.log('✓ scraped_extraction_confidence column removed');
      }

      if (tableDescription.scraped_extraction_method) {
        console.log('Removing scraped_extraction_method column...');
        await queryInterface.removeColumn('Kondos', 'scraped_extraction_method');
        
        // Drop the ENUM type
        await queryInterface.sequelize.query(
          'DROP TYPE IF EXISTS enum_kondos_scraped_extraction_method;'
        );
        console.log('✓ scraped_extraction_method column removed');
      }

      if (tableDescription.scraped_data_source) {
        console.log('Removing scraped_data_source column...');
        await queryInterface.removeColumn('Kondos', 'scraped_data_source');
        console.log('✓ scraped_data_source column removed');
      }

      if (tableDescription.scraped_raw_data) {
        console.log('Removing scraped_raw_data column...');
        await queryInterface.removeColumn('Kondos', 'scraped_raw_data');
        console.log('✓ scraped_raw_data column removed');
      }

      console.log('✓ Rollback completed successfully: All scraping metadata fields removed from Kondos table');

    } catch (error) {
      console.error('❌ Rollback failed:', error.message);
      console.error('Stack trace:', error.stack);
      throw error;
    }
  }
};
