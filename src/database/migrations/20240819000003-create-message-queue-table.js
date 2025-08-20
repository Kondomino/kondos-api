'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Create MessageQueue table
    await queryInterface.createTable('MessageQueue', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      phoneNumber: {
        type: Sequelize.STRING,
        allowNull: false,
        field: 'phone_number'
      },
      messageContent: {
        type: Sequelize.TEXT,
        allowNull: false,
        field: 'message_content'
      },
      whatsappMessageId: {
        type: Sequelize.STRING,
        allowNull: false,
        field: 'whatsapp_message_id'
      },
      conversationId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        field: 'conversation_id',
        references: {
          model: 'Conversations',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      agencyId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        field: 'agency_id',
        references: {
          model: 'RealEstateAgencies',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      messageData: {
        type: Sequelize.JSONB,
        allowNull: false,
        field: 'message_data'
      },
      verificationMetadata: {
        type: Sequelize.JSONB,
        allowNull: false,
        field: 'verification_metadata'
      },
      status: {
        type: Sequelize.ENUM('pending', 'processing', 'completed', 'failed'),
        defaultValue: 'pending',
        allowNull: false
      },
      retryCount: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
        allowNull: false,
        field: 'retry_count'
      },
      maxRetries: {
        type: Sequelize.INTEGER,
        defaultValue: 3,
        allowNull: false,
        field: 'max_retries'
      },
      processedAt: {
        type: Sequelize.DATE,
        allowNull: true,
        field: 'processed_at'
      },
      errorMessage: {
        type: Sequelize.TEXT,
        allowNull: true,
        field: 'error_message'
      },
      grokResponse: {
        type: Sequelize.TEXT,
        allowNull: true,
        field: 'grok_response'
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
        field: 'created_at'
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
        field: 'updated_at'
      }
    });

    // Add indexes for efficient queue processing
    await queryInterface.addIndex('MessageQueue', ['status', 'created_at'], {
      name: 'idx_message_queue_status_created'
    });
    await queryInterface.addIndex('MessageQueue', ['phone_number']);
    await queryInterface.addIndex('MessageQueue', ['conversation_id']);
    await queryInterface.addIndex('MessageQueue', ['agency_id']);
    await queryInterface.addIndex('MessageQueue', ['whatsapp_message_id']);
    await queryInterface.addIndex('MessageQueue', ['status']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('MessageQueue');
  }
};
