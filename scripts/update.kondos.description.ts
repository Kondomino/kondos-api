import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { KondoRepository } from '../src/kondo/repository/kondo.repository';
import { GrokService } from '../src/agentic/agents/chatty/grok.service';
import { Order } from '../src/core/pagination/order.type';
import { UpdateKondoDto } from '../src/kondo/dto/update-kondo.dto';
import * as fs from 'fs';
import * as path from 'path';
import { KondoStatus } from '../src/kondo/entities/kondo.entity';

interface ProcessResult {
  success: boolean;
  kondoId: number;
  kondoName: string;
  oldDescription?: string;
  newDescription?: string;
  duration?: number;
  error?: string;
}

async function bootstrap() {
  console.log('🚀 Starting Kondo Descriptions Update...\n');
  
  // Parse command line arguments for exclude flag
  const args = process.argv.slice(2);
  const excludeIndex = args.findIndex(arg => arg === '--exclude');
  let excludedIds: number[] = [];
  
  if (excludeIndex !== -1 && args[excludeIndex + 1]) {
    excludedIds = args[excludeIndex + 1]
      .split(',')
      .map(id => parseInt(id.trim()))
      .filter(id => !isNaN(id));
    
    if (excludedIds.length > 0) {
      console.log(`🚫 Excluding ${excludedIds.length} kondos: [${excludedIds.join(', ')}]\n`);
    }
  }
  
  const startTime = Date.now();
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
  const logFilePath = path.join(__dirname, `update-descriptions-${timestamp}.log`);
  
  // Initialize NestJS application context
  const app = await NestFactory.createApplicationContext(AppModule);
  
  try {
    // Get services
    const kondoRepository = app.get(KondoRepository);
    const grokService = app.get(GrokService);
    
    // Fetch all kondos
    console.log('📊 Fetching all kondos from database...');
    const searchDto = {
      take: 1000,
      order: Order.DSC,
      page: 1,
      active: true,
      status: KondoStatus.DONE,
      get skip() { return (this.page - 1) * this.take; }
    } as any;
    let kondos = await kondoRepository.findAll(searchDto);
    
    // Filter out excluded kondos
    if (excludedIds.length > 0) {
      const beforeCount = kondos.length;
      kondos = kondos.filter(kondo => !excludedIds.includes(kondo.id));
      const excludedCount = beforeCount - kondos.length;
      if (excludedCount > 0) {
        console.log(`✓ Filtered out ${excludedCount} excluded kondo(s)`);
      }
    }
    
    console.log(`✓ Found ${kondos.length} kondos to process\n`);
    console.log('⏳ Processing with 60-second delay between requests (rate limit: 1/min)...\n');
    
    const results: ProcessResult[] = [];
    let successCount = 0;
    let failCount = 0;
    
    // Process each kondo sequentially with delay
    for (let i = 0; i < kondos.length; i++) {
      const kondo = kondos[i];
      const kondoStartTime = Date.now();
      
      process.stdout.write(`[${i + 1}/${kondos.length}] Processing: ${kondo.name}... `);
      
      try {
        // Prepare the kondo data (clean JSON representation)
        const kondoData = {
          id: kondo.id,
          name: kondo.name,
          type: kondo.type,
          slug: kondo.slug,
          active: kondo.active,
          status: kondo.status,
          highlight: kondo.highlight,
          
          // Location
          city: kondo.city,
          neighborhood: kondo.neighborhood,
          address_street_and_numbers: kondo.address_street_and_numbers,
          cep: kondo.cep,
          minutes_from_bh: kondo.minutes_from_bh,
          
          // Financial
          lot_avg_price: kondo.lot_avg_price,
          condo_rent: kondo.condo_rent,
          lots_available: kondo.lots_available,
          lots_min_size: kondo.lots_min_size,
          finance: kondo.finance,
          finance_tranches: kondo.finance_tranches,
          finance_fees: kondo.finance_fees,
          entry_value_percentage: kondo.entry_value_percentage,
          
          // Property Details
          total_area: kondo.total_area,
          immediate_delivery: kondo.immediate_delivery,
          delivery: kondo.delivery,
          
          // Infrastructure
          infra_description: kondo.infra_description,
          
          // Basic Infrastructure
          infra_eletricity: kondo.infra_eletricity,
          infra_water: kondo.infra_water,
          infra_sidewalks: kondo.infra_sidewalks,
          infra_internet: kondo.infra_internet,
          
          // Security
          infra_lobby_24h: kondo.infra_lobby_24h,
          infra_security_team: kondo.infra_security_team,
          infra_wall: kondo.infra_wall,
          
          // Conveniences
          infra_sports_court: kondo.infra_sports_court,
          infra_barbecue_zone: kondo.infra_barbecue_zone,
          infra_pool: kondo.infra_pool,
          infra_living_space: kondo.infra_living_space,
          infra_pet_area: kondo.infra_pet_area,
          infra_kids_area: kondo.infra_kids_area,
          infra_grass_area: kondo.infra_grass_area,
          infra_gourmet_area: kondo.infra_gourmet_area,
          infra_parking_lot: kondo.infra_parking_lot,
          infra_party_saloon: kondo.infra_party_saloon,
          infra_lounge_bar: kondo.infra_lounge_bar,
          infra_home_office: kondo.infra_home_office,
          infra_market_nearby: kondo.infra_market_nearby,
          
          // Extra/Premium
          infra_lagoon: kondo.infra_lagoon,
          infra_generates_power: kondo.infra_generates_power,
          infra_woods: kondo.infra_woods,
          infra_vegetable_garden: kondo.infra_vegetable_garden,
          infra_nature_trail: kondo.infra_nature_trail,
          infra_gardens: kondo.infra_gardens,
          infra_gym: kondo.infra_gym,
          infra_heliport: kondo.infra_heliport,
          infra_interactive_lobby: kondo.infra_interactive_lobby,
          
          // Contact
          url: kondo.url,
          phone: kondo.phone,
          email: kondo.email,
          video: kondo.video
        };
        
        // Prepare AI messages
        const messages = [
          {
            type: 'system',
            content: `You are an elite, high-end real estate agent with decades of experience in luxury properties. You have a distinctive, slightly eccentric personality that makes your property descriptions memorable and captivating.

Your writing style:
- Sophisticated yet accessible
- Emphasizes lifestyle and emotional appeal over dry facts
- Uses vivid, creative, evocative language without becoming flowery
- Avoids clichés and mundane descriptions (e.g don't always return "Imagine acordar todas as manhãs em ...")
- Never offensive, pejorative, or discriminatory
- Subtly highlights unique features and premium amenities
- Creates a sense of exclusivity and aspiration

Your goal is to craft compelling property descriptions that make potential buyers envision their dream lifestyle in this condominium.`
          },
          {
            type: 'human',
            content: `Based on the following condominium property data (JSON format), generate an engaging, professional description in Portuguese (BR) that will captivate high-end buyers. Focus on:

1. Location advantages and lifestyle
2. Unique amenities and infrastructure
3. Investment potential
4. Quality of life benefits
5. Target demographic appeal

Property Data:
${JSON.stringify(kondoData, null, 2)}

Generate ONLY the description text (2-3 paragraphs, approximately 150-250 words), nothing else. Write in Portuguese (BR). Do not include greetings, titles, or any additional text - just the pure property description.`
          }
        ];
        
        // Call Grok API
        const newDescription = await grokService.generateResponse(messages);
        
        // Clean up the response (remove any markdown or extra formatting)
        const cleanedDescription = newDescription
          .replace(/```[a-z]*\n?/g, '') // Remove code blocks
          .replace(/^["']|["']$/g, '') // Remove surrounding quotes
          .trim();
        
        // Update kondo in database
        const updateDto: UpdateKondoDto = {
          description: cleanedDescription
        } as UpdateKondoDto;
        
        await kondoRepository.update(updateDto, { id: kondo.id });
        
        const duration = (Date.now() - kondoStartTime) / 1000;
        console.log(`✓ (${duration.toFixed(1)}s)`);
        console.log(`   📝 Generated: ${cleanedDescription.substring(0, 150)}${cleanedDescription.length > 150 ? '...' : ''}\n`);
        
        successCount++;
        results.push({
          success: true,
          kondoId: kondo.id,
          kondoName: kondo.name,
          oldDescription: kondo.description,
          newDescription: cleanedDescription,
          duration
        });
        
      } catch (error) {
        const duration = (Date.now() - kondoStartTime) / 1000;
        console.log(`✗ (${duration.toFixed(1)}s)`);
        console.log(`   Error: ${error.message}`);
        
        failCount++;
        results.push({
          success: false,
          kondoId: kondo.id,
          kondoName: kondo.name,
          error: error.message,
          duration
        });
      }
      
      // Wait 60 seconds before next request (except for the last one)
      if (i < kondos.length - 1) {
        const waitTime = 30001; // 30 seconds
        process.stdout.write(`   ⏱️  Waiting 30s before next request...\r`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
        process.stdout.write('                                          \r'); // Clear the waiting message
      }
    }
    
    // Calculate statistics
    const totalDuration = (Date.now() - startTime) / 1000;
    const avgDuration = results.reduce((sum, r) => sum + (r.duration || 0), 0) / results.length;
    
    // Generate log content
    const logContent = generateLogReport({
      timestamp: new Date().toISOString(),
      totalKondos: kondos.length,
      successCount,
      failCount,
      totalDuration,
      avgDuration,
      results
    });
    
    // Write log file
    fs.writeFileSync(logFilePath, logContent, 'utf-8');
    
    // Display summary
    console.log('\n' + '='.repeat(50));
    console.log('✅ Update Complete!');
    console.log('='.repeat(50));
    console.log(`📈 Results:`);
    console.log(`   - Successful: ${successCount}/${kondos.length}`);
    console.log(`   - Failed: ${failCount}/${kondos.length}`);
    console.log(`   - Total Duration: ${formatDuration(totalDuration)}`);
    console.log(`   - Average per Kondo: ${avgDuration.toFixed(1)}s`);
    console.log(`   - Log file: ${path.basename(logFilePath)}`);
    console.log('='.repeat(50) + '\n');
    
  } catch (error) {
    console.error('\n❌ Fatal Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  } finally {
    await app.close();
  }
}

function generateLogReport(data: {
  timestamp: string;
  totalKondos: number;
  successCount: number;
  failCount: number;
  totalDuration: number;
  avgDuration: number;
  results: ProcessResult[];
}): string {
  const lines: string[] = [];
  
  lines.push('='.repeat(70));
  lines.push('KONDO DESCRIPTIONS UPDATE LOG');
  lines.push('='.repeat(70));
  lines.push(`Timestamp: ${data.timestamp}`);
  lines.push(`Total Kondos: ${data.totalKondos}`);
  lines.push(`Successful: ${data.successCount}`);
  lines.push(`Failed: ${data.failCount}`);
  lines.push(`Total Duration: ${formatDuration(data.totalDuration)}`);
  lines.push(`Average Processing Time: ${data.avgDuration.toFixed(1)}s per kondo`);
  lines.push('='.repeat(70));
  lines.push('');
  
  // Add detailed results
  data.results.forEach((result, index) => {
    if (result.success) {
      lines.push(`[SUCCESS] #${result.kondoId} - ${result.kondoName}`);
      lines.push(`  Duration: ${result.duration?.toFixed(1)}s`);
      
      if (result.oldDescription) {
        lines.push(`  Old Description (${result.oldDescription.length} chars):`);
        lines.push(`    ${truncateText(result.oldDescription, 150)}`);
      }
      
      lines.push(`  New Description (${result.newDescription?.length || 0} chars):`);
      lines.push(`    ${truncateText(result.newDescription || '', 150)}`);
      lines.push('');
      
    } else {
      lines.push(`[FAILED] #${result.kondoId} - ${result.kondoName}`);
      lines.push(`  Duration: ${result.duration?.toFixed(1)}s`);
      lines.push(`  Error: ${result.error}`);
      lines.push('');
    }
  });
  
  lines.push('='.repeat(70));
  lines.push('END OF REPORT');
  lines.push('='.repeat(70));
  
  return lines.join('\n');
}

function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
}

function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  
  if (mins > 0) {
    return `${mins}m ${secs}s`;
  }
  return `${secs}s`;
}

// Run the script
bootstrap().catch(error => {
  console.error('Unhandled error:', error);
  process.exit(1);
});
