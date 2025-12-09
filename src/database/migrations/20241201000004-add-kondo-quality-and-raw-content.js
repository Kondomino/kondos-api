module.exports = {
  up: async (queryInterface, Sequelize) => {
    try {
      console.log('Starting migration: Adding Kondo quality fields and raw content tracking...');

      // Add Kondo quality fields
      console.log('Adding kondo_data_updated column to Kondos table...');
      await queryInterface.addColumn('Kondos', 'kondo_data_updated', {
        type: Sequelize.DATE,
        allowNull: true,
        comment: 'Timestamp of the last data quality update'
      });

      console.log('Adding kondo_data_content_quality column to Kondos table...');
      await queryInterface.addColumn('Kondos', 'kondo_data_content_quality', {
        type: Sequelize.DECIMAL(3, 2),
        allowNull: true,
        defaultValue: 0.00,
        comment: 'Content quality score from 0.00 to 1.00'
      });

      console.log('Adding kondo_data_media_quality column to Kondos table...');
      await queryInterface.addColumn('Kondos', 'kondo_data_media_quality', {
        type: Sequelize.DECIMAL(3, 2),
        allowNull: true,
        defaultValue: 0.00,
        comment: 'Media quality score from 0.00 to 1.00'
      });

      // Update Conversation status enum to include 'archived'
      console.log('Updating Conversations status enum to include archived...');
      
      // First, check if the column exists and what type it is
      const conversationTableInfo = await queryInterface.describeTable('Conversations');
      
      if (conversationTableInfo.status) {
        // For PostgreSQL, we need to add the new enum value
        if (queryInterface.sequelize.getDialect() === 'postgres') {
          await queryInterface.sequelize.query(
            "ALTER TYPE \"enum_Conversations_status\" ADD VALUE 'archived';"
          );
        } else {
          // For MySQL and other databases, we need to modify the column
          await queryInterface.changeColumn('Conversations', 'status', {
            type: Sequelize.ENUM('active', 'paused', 'closed', 'archived'),
            defaultValue: 'active',
            allowNull: false
          });
        }
      } else {
        console.log('Warning: Conversations.status column not found, skipping enum update');
      }

      // Create raw content tracking table
      console.log('Creating RawContentEntries table...');
      await queryInterface.createTable('RawContentEntries', {
        id: {
          type: Sequelize.INTEGER,
          primaryKey: true,
          autoIncrement: true,
          allowNull: false
        },
        agency_id: {
          type: Sequelize.INTEGER,
          allowNull: false,
          references: {
            model: 'RealEstateAgencies',
            key: 'id'
          },
          onUpdate: 'CASCADE',
          onDelete: 'CASCADE',
          comment: 'Reference to the real estate agency'
        },
        message_id: {
          type: Sequelize.STRING,
          allowNull: false,
          comment: 'WhatsApp message ID that contained the media'
        },
        content_type: {
          type: Sequelize.ENUM('pdf', 'image', 'video'),
          allowNull: false,
          comment: 'Type of content stored'
        },
        storage_path: {
          type: Sequelize.STRING,
          allowNull: false,
          comment: 'Path to the original file in storage'
        },
        processing_status: {
          type: Sequelize.ENUM('pending', 'processed', 'failed'),
          defaultValue: 'pending',
          allowNull: false,
          comment: 'Current processing status of the raw content'
        },
        metadata: {
          type: Sequelize.JSON,
          allowNull: true,
          comment: 'Additional metadata about the stored content'
        },
        created_at: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.NOW
        },
        updated_at: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.NOW
        }
      });

      // Add indexes for better query performance
      console.log('Adding indexes to RawContentEntries table...');
      await queryInterface.addIndex('RawContentEntries', ['agency_id'], {
        name: 'idx_raw_content_agency_id'
      });

      await queryInterface.addIndex('RawContentEntries', ['message_id'], {
        name: 'idx_raw_content_message_id'
      });

      await queryInterface.addIndex('RawContentEntries', ['processing_status'], {
        name: 'idx_raw_content_processing_status'
      });

      await queryInterface.addIndex('RawContentEntries', ['content_type'], {
        name: 'idx_raw_content_content_type'
      });

      // Composite index for common query patterns
      await queryInterface.addIndex('RawContentEntries', ['agency_id', 'processing_status'], {
        name: 'idx_raw_content_agency_status'
      });

      console.log('Migration completed successfully!');
    } catch (error) {
      console.error('Migration failed:', error);
      throw error;
    }
  },

  down: async (queryInterface, Sequelize) => {
    try {
      console.log('Starting rollback: Removing Kondo quality fields and raw content tracking...');

      // Remove RawContentEntries table
      console.log('Dropping RawContentEntries table...');
      await queryInterface.dropTable('RawContentEntries');

      // Remove Kondo quality columns
      console.log('Removing kondo_data_media_quality column...');
      await queryInterface.removeColumn('Kondos', 'kondo_data_media_quality');

      console.log('Removing kondo_data_content_quality column...');
      await queryInterface.removeColumn('Kondos', 'kondo_data_content_quality');

      console.log('Removing kondo_data_updated column...');
      await queryInterface.removeColumn('Kondos', 'kondo_data_updated');

      // Revert Conversation status enum by recreating it without 'archived'
      console.log('Reverting Conversation status enum...');
      await queryInterface.sequelize.query(`
        ALTER TABLE "Conversations" ALTER COLUMN "status" TYPE VARCHAR(255);
        DROP TYPE IF EXISTS "enum_Conversations_status" CASCADE;
        CREATE TYPE "enum_Conversations_status" AS ENUM ('active', 'paused', 'closed');
        ALTER TABLE "Conversations" ALTER COLUMN "status" TYPE "enum_Conversations_status" USING status::"enum_Conversations_status";
        ALTER TABLE "Conversations" ALTER COLUMN "status" SET DEFAULT 'active';
      `);
      
      // Drop enum types for RawContentEntries
      await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_RawContentEntries_content_type" CASCADE;');
      await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_RawContentEntries_processing_status" CASCADE;');

      console.log('Rollback completed!');
    } catch (error) {
      console.error('Rollback failed:', error);
      throw error;
    }
  }
};
