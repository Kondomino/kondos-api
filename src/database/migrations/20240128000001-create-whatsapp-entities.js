'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Create RealEstateAgencies table
    await queryInterface.createTable('RealEstateAgencies', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      name: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true
      },
      description: {
        type: Sequelize.STRING,
        allowNull: true
      },
      phone_number: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true
      },
      email: {
        type: Sequelize.STRING,
        allowNull: true
      },
      website: {
        type: Sequelize.STRING,
        allowNull: true
      },
      address: {
        type: Sequelize.STRING,
        allowNull: true
      },
      city: {
        type: Sequelize.STRING,
        allowNull: true
      },
      state: {
        type: Sequelize.STRING,
        allowNull: true
      },
      country: {
        type: Sequelize.STRING,
        allowNull: true
      },
      postal_code: {
        type: Sequelize.STRING,
        allowNull: true
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
      },
      metadata: {
        type: Sequelize.JSON,
        allowNull: true
      },
      created_at: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updated_at: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });

    // Create Conversations table
    await queryInterface.createTable('Conversations', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      real_estate_agency_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'RealEstateAgencies',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      whatsapp_number: {
        type: Sequelize.STRING,
        allowNull: false
      },
      agent_name: {
        type: Sequelize.STRING,
        allowNull: true
      },
      status: {
        type: Sequelize.ENUM('active', 'paused', 'closed'),
        defaultValue: 'active'
      },
      notes: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      metadata: {
        type: Sequelize.JSON,
        allowNull: true
      },
      created_at: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updated_at: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });

    // Create Messages table
    await queryInterface.createTable('Messages', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      conversation_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'Conversations',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      whatsapp_message_id: {
        type: Sequelize.STRING,
        allowNull: false
      },
      direction: {
        type: Sequelize.ENUM('incoming', 'outgoing'),
        allowNull: false
      },
      message_type: {
        type: Sequelize.ENUM('text', 'image', 'document', 'audio', 'video', 'location', 'contact', 'sticker'),
        allowNull: false
      },
      text_content: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      media_id: {
        type: Sequelize.STRING,
        allowNull: true
      },
      media_url: {
        type: Sequelize.STRING,
        allowNull: true
      },
      media_filename: {
        type: Sequelize.STRING,
        allowNull: true
      },
      media_mime_type: {
        type: Sequelize.STRING,
        allowNull: true
      },
      media_size: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      media_sha256: {
        type: Sequelize.STRING,
        allowNull: true
      },
      latitude: {
        type: Sequelize.DECIMAL(10, 8),
        allowNull: true
      },
      longitude: {
        type: Sequelize.DECIMAL(11, 8),
        allowNull: true
      },
      location_name: {
        type: Sequelize.STRING,
        allowNull: true
      },
      location_address: {
        type: Sequelize.STRING,
        allowNull: true
      },
      contact_name: {
        type: Sequelize.STRING,
        allowNull: true
      },
      contact_phone: {
        type: Sequelize.STRING,
        allowNull: true
      },
      contact_email: {
        type: Sequelize.STRING,
        allowNull: true
      },
      timestamp: {
        type: Sequelize.DATE,
        allowNull: false
      },
      is_read: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      is_delivered: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      is_sent: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      metadata: {
        type: Sequelize.JSON,
        allowNull: true
      },
      created_at: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updated_at: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });

    // Add indexes for better performance
    await queryInterface.addIndex('Conversations', ['real_estate_agency_id']);
    await queryInterface.addIndex('Conversations', ['whatsapp_number']);
    await queryInterface.addIndex('Conversations', ['status']);
    await queryInterface.addIndex('Messages', ['conversation_id']);
    await queryInterface.addIndex('Messages', ['whatsapp_message_id']);
    await queryInterface.addIndex('Messages', ['direction']);
    await queryInterface.addIndex('Messages', ['message_type']);
    await queryInterface.addIndex('Messages', ['timestamp']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('Messages');
    await queryInterface.dropTable('Conversations');
    await queryInterface.dropTable('RealEstateAgencies');
  }
};

