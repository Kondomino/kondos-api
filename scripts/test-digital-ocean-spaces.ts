#!/usr/bin/env ts-node

/**
 * Simple script to test DigitalOcean Spaces integration
 * Run with: npx ts-node scripts/test-digital-ocean-spaces.ts
 */

import { DigitalOceanSpacesService } from '../src/whatsapp/services/digital-ocean-spaces.service';
import { ConfigService } from '@nestjs/config';
import { config } from 'dotenv';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

// Load environment variables
config();

async function testDigitalOceanSpaces() {
  console.log('🚀 Testing DigitalOcean Spaces Integration\n');

  // Check environment variables
  const requiredVars = [
    'DIGITAL_OCEAN_STORAGE_KEY_ID',
    'DIGITAL_OCEAN_STORAGE_SECRET', 
    'DIGITAL_OCEAN_ORIGIN_ENDPOINT',
    'DIGITAL_OCEAN_CDN_ENDPOINT',
  ];

  console.log('📋 Checking environment variables:');
  for (const varName of requiredVars) {
    const value = process.env[varName];
    if (!value) {
      console.error(`❌ Missing required environment variable: ${varName}`);
      process.exit(1);
    }
    console.log(`✅ ${varName}: ${varName.includes('SECRET') ? '[HIDDEN]' : value}`);
  }
  console.log('');

  // Initialize service
  const configService = new ConfigService();
  let spacesService: DigitalOceanSpacesService;
  
  try {
    spacesService = new DigitalOceanSpacesService(configService);
    console.log('✅ DigitalOcean Spaces service initialized');
    console.log(`   Bucket: ${spacesService.getBucketName()}`);
    console.log(`   CDN: ${spacesService.getCdnEndpoint()}\n`);
  } catch (error) {
    console.error('❌ Failed to initialize DigitalOcean Spaces service:', error.message);
    process.exit(1);
  }

  // Test 1: Connection test
  console.log('🔗 Test 1: Connection Test');
  try {
    const connectionResult = await spacesService.testConnection();
    if (connectionResult.success) {
      console.log('✅ Connection test passed');
      console.log(`   ${connectionResult.message}`);
    } else {
      console.error('❌ Connection test failed:', connectionResult.message);
      return;
    }
  } catch (error) {
    console.error('❌ Connection test error:', error.message);
    return;
  }
  console.log('');

  // Test 2: Simple file upload
  console.log('📤 Test 2: Simple File Upload');
  const testContent = `DigitalOcean Spaces Test File
Created: ${new Date().toISOString()}
From: Kondos API Integration Test
Random: ${Math.random()}`;

  try {
    const uploadResult = await spacesService.uploadFile(
      Buffer.from(testContent, 'utf-8'),
      `test/simple-upload-${Date.now()}.txt`,
      'text/plain',
      {
        testType: 'simple-upload',
        createdBy: 'test-script'
      }
    );

    if (uploadResult.success && uploadResult.url) {
      console.log('✅ File upload successful');
      console.log(`   URL: ${uploadResult.url}`);
      console.log(`   Size: ${uploadResult.size} bytes`);
      
      // Verify file is accessible
      console.log('🔍 Verifying file accessibility...');
      const response = await fetch(uploadResult.url);
      if (response.ok) {
        const downloadedContent = await response.text();
        if (downloadedContent === testContent) {
          console.log('✅ File verification successful - content matches');
        } else {
          console.error('❌ File verification failed - content mismatch');
        }
      } else {
        console.error('❌ File not accessible via CDN:', response.status, response.statusText);
      }
    } else {
      console.error('❌ File upload failed:', uploadResult.error);
    }
  } catch (error) {
    console.error('❌ File upload error:', error.message);
  }
  console.log('');

  // Test 3: PDF Upload (if available)
  console.log('📄 Test 3: PDF Upload');
  const pdfPath = join(process.cwd(), 'references', 'pdfs', 'mirrage.pdf');
  
  if (existsSync(pdfPath)) {
    try {
      const pdfBuffer = readFileSync(pdfPath);
      console.log(`   Found PDF file: ${pdfBuffer.length} bytes`);
      
      const pdfUploadResult = await spacesService.uploadFile(
        pdfBuffer,
        `test/pdf-upload-${Date.now()}.pdf`,
        'application/pdf',
        {
          testType: 'pdf-upload',
          originalFile: 'mirrage.pdf'
        }
      );

      if (pdfUploadResult.success && pdfUploadResult.url) {
        console.log('✅ PDF upload successful');
        console.log(`   URL: ${pdfUploadResult.url}`);
        console.log(`   Size: ${pdfUploadResult.size} bytes`);
        
        // Verify PDF is accessible
        console.log('🔍 Verifying PDF accessibility...');
        const response = await fetch(pdfUploadResult.url);
        if (response.ok) {
          const contentLength = response.headers.get('content-length');
          console.log(`✅ PDF verification successful - accessible via CDN (${contentLength} bytes)`);
        } else {
          console.error('❌ PDF not accessible via CDN:', response.status, response.statusText);
        }
      } else {
        console.error('❌ PDF upload failed:', pdfUploadResult.error);
      }
    } catch (error) {
      console.error('❌ PDF upload error:', error.message);
    }
  } else {
    console.log('⚠️  PDF file not found, skipping PDF test');
  }
  console.log('');

  // Test 4: Processed Media Upload (simulating the real flow)
  console.log('🎭 Test 4: Processed Media Upload Simulation');
  try {
    const mockPdfBuffer = Buffer.from(`%PDF-1.4
Mock PDF for testing processed media upload
Created: ${new Date().toISOString()}
Content: Real estate document simulation`, 'utf-8');

    const mockImageBuffers = [
      Buffer.from(`Mock extracted image 1 - ${Date.now()}`, 'utf-8'),
      Buffer.from(`Mock extracted image 2 - ${Date.now()}`, 'utf-8'),
    ];

    const processedResult = await spacesService.uploadProcessedMedia({
      originalBuffer: mockPdfBuffer,
      originalFilename: 'real-estate-document.pdf',
      originalContentType: 'application/pdf',
      extractedImages: mockImageBuffers,
      messageId: `test-msg-${Date.now()}`,
      agencyId: 1,
    });

    if (processedResult.success) {
      console.log('✅ Processed media upload successful');
      console.log(`   Original file: ${processedResult.originalFileUrl}`);
      console.log(`   Extracted images: ${processedResult.extractedImageUrls?.length || 0}`);
      console.log(`   Total uploads: ${processedResult.totalUploads}`);
      console.log(`   Upload time: ${processedResult.uploadTime}ms`);

      // Verify all files
      const allUrls = [
        processedResult.originalFileUrl!,
        ...(processedResult.extractedImageUrls || [])
      ];

      console.log('🔍 Verifying all uploaded files...');
      for (let i = 0; i < allUrls.length; i++) {
        const url = allUrls[i];
        try {
          const response = await fetch(url);
          if (response.ok) {
            console.log(`   ✅ File ${i + 1} verified: ${url.split('/').pop()}`);
          } else {
            console.error(`   ❌ File ${i + 1} not accessible: ${response.status}`);
          }
        } catch (error) {
          console.error(`   ❌ File ${i + 1} verification error: ${error.message}`);
        }
      }
    } else {
      console.error('❌ Processed media upload failed:', processedResult.error);
    }
  } catch (error) {
    console.error('❌ Processed media upload error:', error.message);
  }
  console.log('');

  console.log('🎉 DigitalOcean Spaces integration test completed!');
  console.log('');
  console.log('💡 Next steps:');
  console.log('   1. Check your DigitalOcean Spaces dashboard to see the uploaded files');
  console.log('   2. Verify the CDN URLs are working in your browser');
  console.log('   3. If all tests passed, the integration is working correctly');
}

// Run the test
testDigitalOceanSpaces().catch(error => {
  console.error('💥 Test script failed:', error);
  process.exit(1);
});
