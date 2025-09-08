module.exports = {
  up: async (queryInterface, Sequelize) => {
    try {
      console.log('Starting migration: Adding Media status and storage_url fields...');

      // Check if Media table exists
      const tables = await queryInterface.showAllTables();
      const mediaTableExists = tables.includes('Media') || tables.includes('media');
      
      if (!mediaTableExists) {
        console.log('Media table does not exist. Creating Media table...');
        
        // Create the Media table with all fields including the new ones
        await queryInterface.createTable('Media', {
          id: {
            type: Sequelize.INTEGER,
            primaryKey: true,
            autoIncrement: true,
            allowNull: false
          },
          filename: {
            type: Sequelize.STRING,
            allowNull: false,
            comment: 'Original filename of the media'
          },
          type: {
            type: Sequelize.ENUM('video', 'image'),
            defaultValue: 'image',
            allowNull: false,
            comment: 'Type of media: image or video'
          },
          status: {
            type: Sequelize.STRING(10),
            defaultValue: 'draft',
            allowNull: false,
            comment: 'Status of media: draft (not processed) or final (ready for quality scoring)'
          },
          storage_url: {
            type: Sequelize.STRING,
            allowNull: true,
            comment: 'URL to the media file in DigitalOcean Spaces or other storage'
          },
          kondoId: {
            type: Sequelize.INTEGER,
            allowNull: true,
            references: {
              model: 'Kondos',
              key: 'id'
            },
            onUpdate: 'CASCADE',
            onDelete: 'SET NULL',
            comment: 'Reference to the Kondo this media belongs to'
          },
          unitId: {
            type: Sequelize.INTEGER,
            allowNull: true,
            references: {
              model: 'Units',
              key: 'id'
            },
            onUpdate: 'CASCADE',
            onDelete: 'SET NULL',
            comment: 'Reference to the Unit this media belongs to'
          },
          createdAt: {
            type: Sequelize.DATE,
            allowNull: false,
            defaultValue: Sequelize.NOW
          },
          updatedAt: {
            type: Sequelize.DATE,
            allowNull: false,
            defaultValue: Sequelize.NOW
          }
        });

        // Add CHECK constraint for status column
        console.log('Adding CHECK constraint for status column...');
        try {
          await queryInterface.sequelize.query(`
            ALTER TABLE "Media" ADD CONSTRAINT "chk_media_status" 
            CHECK (status IN ('draft', 'final'))
          `);
        } catch (error) {
          console.log('CHECK constraint may already exist or not supported:', error.message);
        }

        console.log('Media table created successfully!');
      } else {
        console.log('Media table exists. Adding new columns...');

        // Check existing columns
        const mediaTableInfo = await queryInterface.describeTable('Media');
        
        // Add status column if it doesn't exist
        if (!mediaTableInfo.status) {
          console.log('Adding status column to Media table...');
          await queryInterface.addColumn('Media', 'status', {
            type: Sequelize.STRING(10),
            defaultValue: 'draft',
            allowNull: false,
            comment: 'Status of media: draft (not processed) or final (ready for quality scoring)'
          });
          
          // Add CHECK constraint to ensure only valid values
          console.log('Adding CHECK constraint for status column...');
          try {
            await queryInterface.sequelize.query(`
              ALTER TABLE "Media" ADD CONSTRAINT "chk_media_status" 
              CHECK (status IN ('draft', 'final'))
            `);
          } catch (error) {
            console.log('CHECK constraint may already exist or not supported:', error.message);
          }
        } else {
          console.log('Status column already exists in Media table.');
        }

        // Add storage_url column if it doesn't exist
        if (!mediaTableInfo.storage_url) {
          console.log('Adding storage_url column to Media table...');
          await queryInterface.addColumn('Media', 'storage_url', {
            type: Sequelize.STRING,
            allowNull: true,
            comment: 'URL to the media file in DigitalOcean Spaces or other storage'
          });
        } else {
          console.log('storage_url column already exists in Media table.');
        }
      }

      // Add indexes for better query performance
      console.log('Adding indexes to Media table...');
      
      try {
        await queryInterface.addIndex('Media', ['kondoId'], {
          name: 'idx_media_kondo_id'
        });
      } catch (error) {
        console.log('Index idx_media_kondo_id may already exist:', error.message);
      }

      try {
        await queryInterface.addIndex('Media', ['unitId'], {
          name: 'idx_media_unit_id'
        });
      } catch (error) {
        console.log('Index idx_media_unit_id may already exist:', error.message);
      }

      try {
        await queryInterface.addIndex('Media', ['status'], {
          name: 'idx_media_status'
        });
      } catch (error) {
        console.log('Index idx_media_status may already exist:', error.message);
      }

      try {
        await queryInterface.addIndex('Media', ['type'], {
          name: 'idx_media_type'
        });
      } catch (error) {
        console.log('Index idx_media_type may already exist:', error.message);
      }

      // Composite index for common query patterns (final media for quality scoring)
      try {
        await queryInterface.addIndex('Media', ['kondoId', 'status'], {
          name: 'idx_media_kondo_status'
        });
      } catch (error) {
        console.log('Index idx_media_kondo_status may already exist:', error.message);
      }

      console.log('Migration completed successfully!');
    } catch (error) {
      console.error('Migration failed:', error);
      throw error;
    }
  },

  down: async (queryInterface, Sequelize) => {
    try {
      console.log('Starting rollback: Removing Media status and storage_url fields...');

      // Check if Media table exists
      const tables = await queryInterface.showAllTables();
      const mediaTableExists = tables.includes('Media') || tables.includes('media');
      
      if (mediaTableExists) {
        const mediaTableInfo = await queryInterface.describeTable('Media');
        
        // Remove storage_url column if it exists
        if (mediaTableInfo.storage_url) {
          console.log('Removing storage_url column from Media table...');
          await queryInterface.removeColumn('Media', 'storage_url');
        }

        // Remove status column if it exists
        if (mediaTableInfo.status) {
          console.log('Removing CHECK constraint for status column...');
          try {
            await queryInterface.sequelize.query('ALTER TABLE "Media" DROP CONSTRAINT IF EXISTS "chk_media_status"');
          } catch (error) {
            console.log('CHECK constraint may not exist or already removed:', error.message);
          }
          
          console.log('Removing status column from Media table...');
          await queryInterface.removeColumn('Media', 'status');
        }

        // Remove indexes
        console.log('Removing indexes from Media table...');
        const indexes = ['idx_media_kondo_id', 'idx_media_unit_id', 'idx_media_status', 'idx_media_type', 'idx_media_kondo_status'];
        
        for (const indexName of indexes) {
          try {
            await queryInterface.removeIndex('Media', indexName);
          } catch (error) {
            console.log(`Index ${indexName} may not exist or already removed:`, error.message);
          }
        }
      } else {
        console.log('Media table does not exist, nothing to rollback.');
      }

      console.log('Rollback completed!');
    } catch (error) {
      console.error('Rollback failed:', error);
      throw error;
    }
  }
};
