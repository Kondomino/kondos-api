'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Create Users table
    await queryInterface.createTable('Users', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      firstName: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      lastName: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      picture: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      password: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      email: {
        type: Sequelize.STRING,
        unique: true,
        allowNull: false,
      },
      gender: {
        type: Sequelize.ENUM('male', 'female'),
        allowNull: true,
      },
      age: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      active: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
    });

    // Create Kondos table
    await queryInterface.createTable('Kondos', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      name: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      active: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
      },
      status: {
        type: Sequelize.ENUM('draft', 'text_ready', 'media_gathering', 'done'),
        defaultValue: 'draft',
      },
      highlight: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
      },
      slug: {
        type: Sequelize.STRING,
        unique: true,
      },
      featured_image: {
        type: Sequelize.STRING,
        unique: false,
      },
      type: {
        type: Sequelize.ENUM('bairro', 'casas', 'chacatas', 'predios', 'comercial', 'industrial'),
        defaultValue: 'casas',
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      // Address fields
      minutes_from_bh: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      cep: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      address_street_and_numbers: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      neighborhood: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      city: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      // Details fields
      lot_avg_price: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: true,
      },
      condo_rent: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: true,
      },
      lots_available: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
      },
      lots_min_size: {
        type: Sequelize.STRING,
        defaultValue: false,
      },
      finance: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
      },
      finance_tranches: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      finance_fees: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
      },
      entry_value_percentage: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      // Infrastructure fields
      infra_description: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      infra_lobby_24h: {
        type: Sequelize.BOOLEAN,
        allowNull: true,
      },
      infra_security_team: {
        type: Sequelize.BOOLEAN,
        allowNull: true,
      },
      infra_wall: {
        type: Sequelize.BOOLEAN,
        allowNull: true,
      },
      infra_sports_court: {
        type: Sequelize.BOOLEAN,
        allowNull: true,
      },
      infra_barbecue_zone: {
        type: Sequelize.BOOLEAN,
        allowNull: true,
      },
      infra_pool: {
        type: Sequelize.BOOLEAN,
        allowNull: true,
      },
      infra_living_space: {
        type: Sequelize.BOOLEAN,
        allowNull: true,
      },
      infra_pet_area: {
        type: Sequelize.BOOLEAN,
        allowNull: true,
      },
      infra_kids_area: {
        type: Sequelize.BOOLEAN,
        allowNull: true,
      },
      infra_lagoon: {
        type: Sequelize.BOOLEAN,
        allowNull: true,
      },
      infra_eletricity: {
        type: Sequelize.BOOLEAN,
        allowNull: true,
      },
      infra_water: {
        type: Sequelize.BOOLEAN,
        allowNull: true,
      },
      infra_sidewalks: {
        type: Sequelize.BOOLEAN,
        allowNull: true,
      },
      infra_internet: {
        type: Sequelize.BOOLEAN,
        allowNull: true,
      },
      infra_generates_power: {
        type: Sequelize.BOOLEAN,
        allowNull: true,
      },
      infra_grass_area: {
        type: Sequelize.BOOLEAN,
        allowNull: true,
      },
      infra_woods: {
        type: Sequelize.BOOLEAN,
        allowNull: true,
      },
      infra_vegetable_garden: {
        type: Sequelize.BOOLEAN,
        allowNull: true,
      },
      infra_nature_trail: {
        type: Sequelize.BOOLEAN,
        allowNull: true,
      },
      infra_gourmet_area: {
        type: Sequelize.BOOLEAN,
        allowNull: true,
      },
      infra_parking_lot: {
        type: Sequelize.BOOLEAN,
        allowNull: true,
      },
      infra_heliport: {
        type: Sequelize.BOOLEAN,
        allowNull: true,
      },
      infra_gym: {
        type: Sequelize.BOOLEAN,
        allowNull: true,
      },
      infra_gardens: {
        type: Sequelize.BOOLEAN,
        allowNull: true,
      },
      infra_interactive_lobby: {
        type: Sequelize.BOOLEAN,
        allowNull: true,
      },
      infra_home_office: {
        type: Sequelize.BOOLEAN,
        allowNull: true,
      },
      infra_lounge_bar: {
        type: Sequelize.BOOLEAN,
        allowNull: true,
      },
      infra_party_saloon: {
        type: Sequelize.BOOLEAN,
        allowNull: true,
      },
      infra_market_nearby: {
        type: Sequelize.BOOLEAN,
        allowNull: true,
      },
      // Other fields
      total_area: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      immediate_delivery: {
        type: Sequelize.BOOLEAN,
        allowNull: true,
      },
      url: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      phone: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      email: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      video: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
    });

    // Create Units table
    await queryInterface.createTable('Units', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      title: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      kondoId: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'Kondos',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      userId: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'Users',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      active: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
      },
      status: {
        type: Sequelize.ENUM('draft', 'text_ready', 'media_gathering', 'published'),
        defaultValue: 'draft',
      },
      bedrooms: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
      },
      baths: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
      },
      suites: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
      },
      parking_spaces: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
      },
      is_roof: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
      },
      value: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      furnished: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
      },
      closet: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
      },
      unit_type: {
        type: Sequelize.ENUM('apartment', 'house', 'lot'),
        allowNull: false,
      },
      area: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: true,
      },
      lot_size: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      floor: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      building: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      features: {
        type: Sequelize.JSON,
        allowNull: true,
      },
      images: {
        type: Sequelize.JSON,
        allowNull: true,
      },
      video_url: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      contact_phone: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      contact_email: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
    });

    // Create Media table
    await queryInterface.createTable('Media', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      filename: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      type: {
        type: Sequelize.ENUM('video', 'image'),
        defaultValue: 'image',
      },
      kondoId: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'Kondos',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      unitId: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'Units',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
    });

    // Create Likes table
    await queryInterface.createTable('Likes', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      userId: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'Users',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      kondoId: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'Kondos',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      unitId: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'Units',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
    });
  },

  async down(queryInterface, Sequelize) {
    // Drop tables in reverse order to handle foreign key constraints
    await queryInterface.dropTable('Likes');
    await queryInterface.dropTable('Media');
    await queryInterface.dropTable('Units');
    await queryInterface.dropTable('Kondos');
         await queryInterface.dropTable('Users');
   }
 }; 