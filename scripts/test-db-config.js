#!/usr/bin/env node

// Test script to verify database configuration works correctly
require('dotenv').config();

console.log('🧪 Testing Database Configuration...\n');

// Test different environments
const environments = [
  { name: 'Development', NODE_ENV: 'development' },
  { name: 'Test', NODE_ENV: 'test' },
  { name: 'Production (Local)', NODE_ENV: 'production' },
  { name: 'Production (Render External URL)', NODE_ENV: 'production', RENDER_EXTERNAL_URL: 'postgresql://user:pass@host:5432/db' },
  { name: 'Production (Render Individual Vars)', NODE_ENV: 'production', RENDER_HOSTNAME: 'host.render.com', RENDER_DB: 'db', RENDER_USR: 'user', RENDER_PWD: 'pass', RENDER_DB_PORT: '5432' }
];

environments.forEach((env, index) => {
  console.log(`\n${index + 1}. Testing: ${env.name}`);
  console.log('Environment variables:');
  
  // Set environment variables for this test
  Object.keys(env).forEach(key => {
    if (key !== 'name') {
      process.env[key] = env[key];
      console.log(`   ${key}=${key.includes('PWD') ? '***' : env[key]}`);
    }
  });
  
  // Test the configuration
  try {
    const dbConfig = require('../src/database/config.js');
    const config = dbConfig[env.NODE_ENV || 'development'];
    
    console.log('✅ Configuration result:');
    console.log(`   Environment: ${env.NODE_ENV || 'development'}`);
    if (config.url) {
      console.log(`   URL: ${config.url.replace(/\/\/.*@/, '//***:***@')}`);
    } else {
      console.log(`   Host: ${config.host}`);
      console.log(`   Port: ${config.port}`);
      console.log(`   Database: ${config.database}`);
      console.log(`   Username: ${config.username}`);
    }
    console.log(`   Dialect: ${config.dialect}`);
    console.log(`   SSL: ${config.dialectOptions?.ssl ? 'Enabled' : 'Disabled'}`);
    
  } catch (error) {
    console.log('❌ Configuration error:', error.message);
  }
  
  console.log('─'.repeat(50));
});

console.log('\n✅ Database configuration test completed!');
