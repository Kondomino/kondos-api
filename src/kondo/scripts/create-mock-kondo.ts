#!/usr/bin/env npx ts-node

import { 
  mockKondoData, 
  mockKondoBairroData, 
  mockKondoComercialData, 
  mockKondoWithRelationsData,
  mockKondoCasas2Data,
  mockKondoCasas3Data,
  mockKondoCasas4Data,
  mockKondoCasas5Data
} from '../../database/mocks';

/**
 * Script to create mock Kondo data in the database via API calls
 * Usage: npx ts-node src/kondo/scripts/create-mock-kondo.ts
 */

const API_BASE_URL = 'http://localhost:3003/api';

async function makeRequest(url: string, method: string = 'GET', data?: any) {
  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    
    const response = await fetch(url, {
      method,
      headers,
      body: data ? JSON.stringify(data) : undefined,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }

    return await response.json();
  } catch (error) {
    console.error(`❌ Request failed for ${method} ${url}:`, error);
    throw error;
  }
}

async function createMockKondos() {
  console.log('🏠 Creating mock Kondo data in the database...\n');

  try {
    // Check if server is running
    console.log('🔍 Checking if server is running...');
    try {
      await makeRequest(`${API_BASE_URL}/kondo`);
      console.log('✅ Server is running!\n');
    } catch (error) {
      console.error('❌ Server is not running. Please start the server first:');
      console.error('   npm run start:dev\n');
      process.exit(1);
    }

    const kondos = [
      { name: 'Vila Verde Premium (Casas)', data: mockKondoData },
      { name: 'Reserva do Vale (Casas)', data: mockKondoCasas2Data },
      { name: 'Sunset Hills (Casas)', data: mockKondoCasas3Data },
      { name: 'Pedra Azul (Casas)', data: mockKondoCasas4Data },
      { name: 'Portal das Águas (Casas)', data: mockKondoCasas5Data },
      { name: 'Bairro Horizonte (Bairro)', data: mockKondoBairroData },
      { name: 'Tech Park (Comercial)', data: mockKondoComercialData },
    ];

    const createdKondos = [];

    // Create each kondo
    for (const kondo of kondos) {
      console.log(`🏗️  Creating: ${kondo.name}...`);
      
      try {
        const result = await makeRequest(`${API_BASE_URL}/kondo`, 'POST', kondo.data);
        createdKondos.push(result);
        console.log(`   ✅ Created with ID: ${result.id}`);
        console.log(`   📍 Address: ${result.city}, ${result.neighborhood}`);
        console.log(`   💰 Price: ${result.lot_avg_price ? `$${result.lot_avg_price.toLocaleString()}` : 'N/A'}`);
        console.log('');
      } catch (error) {
        console.error(`   ❌ Failed to create ${kondo.name}:`, error.message);
        console.log('');
      }
    }

    // Summary
    console.log(`\n🎉 Successfully created ${createdKondos.length}/${kondos.length} kondos!`);
    
    if (createdKondos.length > 0) {
      console.log('\n📊 Summary:');
      createdKondos.forEach((kondo, index) => {
        console.log(`   ${index + 1}. ${kondo.name} (ID: ${kondo.id})`);
      });

      console.log('\n🔍 Test your API:');
      console.log(`   curl -X GET ${API_BASE_URL}/kondo | jq`);
      console.log(`   curl -X GET ${API_BASE_URL}/kondo/${createdKondos[0].id} | jq`);
    }

  } catch (error) {
    console.error('❌ Error creating mock data:', error);
    process.exit(1);
  }
}

// Instructions for usage
console.log(`
🎯 USAGE INSTRUCTIONS:

1. Start your server: npm run start:dev

2. Run this script: npm run create:kondo

3. The script will:
   - Check if server is running
   - Create 7 different kondo types in the database
   - Show creation results and IDs
   - Provide test commands

4. Manual API testing:
   
   List all kondos (no auth required):
   curl -X GET http://localhost:3003/api/kondo | jq

   Get specific kondo (no auth required):
   curl -X GET http://localhost:3003/api/kondo/1 | jq

   Create kondo (no auth required):
   curl -X POST http://localhost:3003/api/kondo \\
     -H "Content-Type: application/json" \\
     -d '{"name":"Test Kondo","email":"test@example.com"}'

5. Frontend integration:
   
   import { mockKondoData } from '../../database/mocks';
   
   const response = await fetch('/api/kondo', {
     method: 'POST',
     headers: { 
       'Content-Type': 'application/json'
     },
     body: JSON.stringify(mockKondoData)
   });
`);

if (require.main === module) {
  createMockKondos();
}