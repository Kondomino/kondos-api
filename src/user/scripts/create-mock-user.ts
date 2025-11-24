#!/usr/bin/env npx ts-node

import { 
  mockVictorSoutoData,
  mockMariaSlvaData,
  mockJoaoSantosData,
  mockInactiveUserData,
  mockUsersData
} from '../../database/mocks';

/**
 * Script to create mock User data in the database via API calls
 * Usage: npx ts-node src/user/scripts/create-mock-user.ts
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

async function createMockUsers() {
  console.log('👥 Creating mock User data in the database...\n');

  try {
    // Check if server is running
    console.log('🔍 Checking if server is running...');
    try {
      await makeRequest(`${API_BASE_URL}/user`);
      console.log('✅ Server is running!\n');
    } catch (error) {
      console.error('❌ Server is not running. Please start the server first:');
      console.error('   npm run start:dev\n');
      process.exit(1);
    }

    const users = [
      { name: 'Victor Souto (Active)', data: mockVictorSoutoData },
      { name: 'Maria Silva (Active)', data: mockMariaSlvaData },
      { name: 'João Santos (Active)', data: mockJoaoSantosData },
      { name: 'Inactive User (Deactivated)', data: mockInactiveUserData },
    ];

    const createdUsers = [];

    // Create each user
    for (const user of users) {
      console.log(`👤 Creating: ${user.name}...`);
      
      try {
        const result = await makeRequest(`${API_BASE_URL}/user`, 'POST', user.data);
        createdUsers.push(result);
        console.log(`   ✅ Created with ID: ${result.id}`);
        console.log(`   📧 Email: ${result.email}`);
        console.log(`   📊 Status: ${result.active ? 'Active' : 'Inactive'}`);
        console.log('');
      } catch (error) {
        console.error(`   ❌ Failed to create ${user.name}:`, error.message);
        console.log('');
      }
    }

    // Summary
    console.log(`\n🎉 Successfully created ${createdUsers.length}/${users.length} users!`);
    
    if (createdUsers.length > 0) {
      console.log('\n📊 Summary:');
      createdUsers.forEach((user, index) => {
        const status = user.active ? '✅ Active' : '❌ Inactive';
        console.log(`   ${index + 1}. ${user.firstName} ${user.lastName} (${user.email}) - ${status} [ID: ${user.id}]`);
      });

      console.log('\n🔍 Test your API:');
      console.log(`   curl -X GET ${API_BASE_URL}/user | jq`);
      console.log(`   curl -X GET ${API_BASE_URL}/user/${createdUsers[0].id} | jq`);
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

2. Run this script: npm run create:user

3. The script will:
   - Check if server is running
   - Create 4 mock users (3 active, 1 deactivated)
   - Show creation results and IDs
   - Provide test commands

4. Users created:
   - Victor Souto (Active) - souto.victor@gmail.com
   - Maria Silva (Active) - maria.silva@example.com
   - João Santos (Active) - joao.santos@example.com
   - Inactive User (Deactivated) - inactive.user@example.com

5. Manual API testing:
   
   List all users (no auth required):
   curl -X GET http://localhost:3003/api/user | jq

   Get specific user (no auth required):
   curl -X GET http://localhost:3003/api/user/1 | jq

   Create user (no auth required):
   curl -X POST http://localhost:3003/api/user \\
     -H "Content-Type: application/json" \\
     -d '{
       "email":"test@example.com",
       "password":"Test123!",
       "firstName":"Test",
       "lastName":"User"
     }'

6. Frontend integration:
   
   import { mockUsersData } from '../../database/mocks';
   
   const response = await fetch('/api/user', {
     method: 'POST',
     headers: { 
       'Content-Type': 'application/json'
     },
     body: JSON.stringify(mockUsersData[0])
   });
`);

if (require.main === module) {
  createMockUsers();
}
