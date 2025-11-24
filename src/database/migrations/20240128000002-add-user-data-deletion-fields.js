'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Add new columns to Users table for data deletion support
    await queryInterface.addColumn('Users', 'whatsapp_id', {
      type: Sequelize.STRING,
      allowNull: true,
    });

    await queryInterface.addColumn('Users', 'phone_number', {
      type: Sequelize.STRING,
      allowNull: true,
    });

    await queryInterface.addColumn('Users', 'is_deleted', {
      type: Sequelize.BOOLEAN,
      defaultValue: false,
    });

    await queryInterface.addColumn('Users', 'deleted_at', {
      type: Sequelize.DATE,
      allowNull: true,
    });

    // Add indexes for better performance
    await queryInterface.addIndex('Users', ['whatsapp_id']);
    await queryInterface.addIndex('Users', ['phone_number']);
    await queryInterface.addIndex('Users', ['is_deleted']);
  },

  down: async (queryInterface, Sequelize) => {
    // Remove indexes
    await queryInterface.removeIndex('Users', ['whatsapp_id']);
    await queryInterface.removeIndex('Users', ['phone_number']);
    await queryInterface.removeIndex('Users', ['is_deleted']);

    // Remove columns
    await queryInterface.removeColumn('Users', 'whatsapp_id');
    await queryInterface.removeColumn('Users', 'phone_number');
    await queryInterface.removeColumn('Users', 'is_deleted');
    await queryInterface.removeColumn('Users', 'deleted_at');
  }
};
