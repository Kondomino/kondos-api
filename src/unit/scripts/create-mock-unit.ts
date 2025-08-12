#!/usr/bin/env npx ts-node

import { 
  mockApartmentUnit1,
  mockApartmentUnit2,
  mockApartmentUnit3,
  mockApartmentUnit4,
  mockHouseUnit1,
  mockHouseUnit2,
  mockHouseUnit3,
  mockHouseUnit4,
  mockLotUnit1,
  mockLotUnit2,
  mockLotUnit3
} from '../../database/mocks';

/**
 * Script to create mock Unit data in the database via API calls
 * Usage: npx ts-node src/unit/scripts/create-mock-unit.ts
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

async function createMockUnits() {
  console.log('🏠 Creating mock Unit data in the database...\n');

  try {
    // Check if server is running
    console.log('🔍 Checking if server is running...');
    try {
      await makeRequest(`${API_BASE_URL}/unit`);
      console.log('✅ Server is running!\n');
    } catch (error) {
      console.error('❌ Server is not running. Please start the server first:');
      console.error('   npm run start:dev\n');
      process.exit(1);
    }

    const units = [
      { name: 'Apartamento 2 Quartos - Torre A', data: mockApartmentUnit1 },
      { name: 'Studio Premium - Torre B', data: mockApartmentUnit2 },
      { name: 'Cobertura Triplex - Torre C', data: mockApartmentUnit3 },
      { name: 'Apartamento 3 Quartos - Pedra Azul', data: mockApartmentUnit4 },
      { name: 'Casa Familiar - Vila Verde', data: mockHouseUnit1 },
      { name: 'Villa de Luxo - Reserva do Vale', data: mockHouseUnit2 },
      { name: 'Townhouse Moderno - Sunset Hills', data: mockHouseUnit3 },
      { name: 'Casa Sustentável - Portal das Águas', data: mockHouseUnit4 },
      { name: 'Lote Residencial - Vila Verde', data: mockLotUnit1 },
      { name: 'Lote Premium - Reserva do Vale', data: mockLotUnit2 },
      { name: 'Lote Comercial - Tech Park', data: mockLotUnit3 },
    ];

    const createdUnits = [];

    // Create each unit
    for (const unit of units) {
      console.log(`🏗️  Creating: ${unit.name}...`);
      
      try {
        const result = await makeRequest(`${API_BASE_URL}/unit`, 'POST', unit.data);
        createdUnits.push(result);
        console.log(`   ✅ Created with ID: ${result.id}`);
        console.log(`   🏢 Type: ${result.unit_type}`);
        console.log(`   💰 Price: ${result.value || 'N/A'}`);
        console.log(`   📍 Kondo ID: ${result.kondoId}`);
        console.log('');
      } catch (error) {
        console.error(`   ❌ Failed to create ${unit.name}:`, error.message);
        console.log('');
      }
    }

    // Summary
    console.log(`\n🎉 Successfully created ${createdUnits.length}/${units.length} units!`);
    
    if (createdUnits.length > 0) {
      console.log('\n📊 Summary:');
      createdUnits.forEach((unit, index) => {
        console.log(`   ${index + 1}. ${unit.title} (ID: ${unit.id}) - ${unit.unit_type}`);
      });

      console.log('\n🔍 Test your API:');
      console.log(`   curl -X GET ${API_BASE_URL}/unit | jq`);
      console.log(`   curl -X GET ${API_BASE_URL}/unit/${createdUnits[0].id} | jq`);
      
      // Group by type
      const apartments = createdUnits.filter(u => u.unit_type === 'apartment');
      const houses = createdUnits.filter(u => u.unit_type === 'house');
      const lots = createdUnits.filter(u => u.unit_type === 'lot');
      
      console.log('\n📈 Breakdown by Type:');
      console.log(`   🏢 Apartments: ${apartments.length}`);
      console.log(`   🏠 Houses: ${houses.length}`);
      console.log(`   🏞️  Lots: ${lots.length}`);
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

2. Run this script: npm run create:unit

3. The script will:
   - Check if server is running
   - Create 11 different unit types in the database
   - Show creation results and IDs
   - Provide test commands

4. Manual API testing:
   
   List all units (no auth required):
   curl -X GET http://localhost:3003/api/unit | jq

   Get specific unit (no auth required):
   curl -X GET http://localhost:3003/api/unit/1 | jq

   Create unit (no auth required):
   curl -X POST http://localhost:3003/api/unit \\
     -H "Content-Type: application/json" \\
     -d '{"title":"Test Unit","kondoId":1,"userId":1,"unit_type":"apartment"}'

5. Frontend integration:
   
   import { mockApartmentUnit1 } from '../../database/mocks';
   
   const response = await fetch('/api/unit', {
     method: 'POST',
     headers: { 
       'Content-Type': 'application/json'
     },
     body: JSON.stringify(mockApartmentUnit1)
   });
`);

if (require.main === module) {
  createMockUnits();
} 