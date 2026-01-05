import { Injectable, Logger } from '@nestjs/common';
import { GrokService } from '../../agents/chatty/grok.service';
import { Kondo } from '../../../kondo/entities/kondo.entity';

@Injectable()
export class AmenityExtractorService {
  private readonly logger = new Logger(AmenityExtractorService.name);

  // Keyword mapping for pattern-based extraction
  // Includes compound words for better filename matching (e.g., "CLUBEPISCINA", "SALAODEFESTAS")
  private readonly amenityKeywords = {
    infra_pool: ['piscina', 'pool', 'natação', 'swimming', 'clube piscina', 'clubepiscina'],
    infra_gym: ['academia', 'fitness', 'gym', 'musculação'],
    infra_sauna: ['sauna', 'spa'],
    infra_party_saloon: ['salão de festas', 'salao de festas', 'salaodefestas', 'party hall', 'festa', 'salão', 'salao'],
    infra_kids_area: ['playground', 'parquinho', 'brinquedoteca', 'kids', 'infantil', 'area infantil', 'areainfantil'],
    infra_sports_court: ['quadra', 'court', 'poliesportiva', 'esporte', 'beach tennis', 'beachtennis', 'tennis', 'futebol'],
    infra_barbecue_zone: ['churrasqueira', 'bbq', 'grill', 'churras', 'area churras', 'areachurras'],
    infra_gardens: ['jardim', 'garden', 'paisagismo'],
    infra_lobby_24h: ['portaria 24h', 'portaria', 'lobby 24h', '24 horas', 'guarita'],
    infra_security_team: ['segurança', 'security', 'vigilância'],
    infra_home_office: ['coworking', 'escritório', 'home office', 'office', 'espaco trabalho'],
    infra_bike_rack: ['bicicletário', 'bicicletario', 'bike rack', 'paraciclo', 'bike'],
    infra_pet_area: ['pet place', 'petplace', 'espaço pet', 'espacopet', 'dog', 'pet'],
    infra_laundry: ['lavanderia', 'laundry'],
    infra_parking_lot: ['estacionamento', 'garagem', 'parking', 'vaga'],
    infra_gourmet_area: ['gourmet', 'área gourmet', 'areagourmet', 'espaco gourmet', 'espacogourmet'],
    infra_living_space: ['espaço convivência', 'espacoconvivencia', 'living', 'lounge'],
    infra_lounge_bar: ['lounge bar', 'loungebar', 'bar'],
    infra_lagoon: ['lagoa', 'lagoon'],
    infra_woods: ['bosque', 'woods', 'mata'],
    infra_vegetable_garden: ['horta', 'vegetable garden'],
    infra_nature_trail: ['trilha', 'trail', 'caminhada'],
    infra_generates_power: ['energia solar', 'solar', 'sustentável', 'geração de energia'],
    infra_heliport: ['heliponto', 'heliport'],
    infra_interactive_lobby: ['lobby interativo', 'interactive lobby'],
    infra_wall: ['murado', 'muro', 'wall', 'cerca'],
    infra_grass_area: ['gramado', 'grass', 'área verde', 'areaverde'],
    infra_market_nearby: ['mercado', 'supermercado', 'market', 'comércio'],
    infra_eletricity: ['energia elétrica', 'eletricidade', 'electricity'],
    infra_water: ['água', 'water', 'abastecimento'],
    infra_sidewalks: ['calçada', 'sidewalk', 'passeio'],
    infra_internet: ['internet', 'fibra', 'wi-fi', 'wifi'],
  };

  constructor(private readonly grokService: GrokService) {}

  /**
   * Extract amenities from raw scraped data OR existing kondo fields
   * Uses pattern matching + AI verification for ambiguous cases
   * Works with or without scraped_raw_data
   */
  async extract(
    rawData: any,
    existingData: Partial<Kondo>,
  ): Promise<Record<string, boolean>> {
    this.logger.log(
      `Extracting amenities for kondo: ${existingData.name} (ID: ${existingData.id})`,
    );

    try {
      const amenities: Record<string, boolean> = {};

      // Build searchable text from multiple sources
      let searchText = '';
      const sources: string[] = [];
      
      // Source 1: Use raw data if available
      if (rawData) {
        searchText += this.flattenToText(rawData).toLowerCase() + ' ';
        sources.push('raw_data');
      } 
      // Source 2: Use existing kondo fields (description, infra_description, etc.)
      else {
        searchText += this.buildSearchTextFromKondo(existingData).toLowerCase() + ' ';
        sources.push('existing_fields');
      }

      // Source 3: Extract from media filenames (ALWAYS check, even if raw data exists)
      if (existingData.medias && existingData.medias.length > 0) {
        const mediaText = this.extractFromMediaFilenames(existingData.medias);
        searchText += mediaText.toLowerCase();
        sources.push(`media_filenames(${existingData.medias.length})`);
      }

      this.logger.log(`Amenity extraction using: ${sources.join(', ')}`);

      // Pattern matching
      for (const [field, keywords] of Object.entries(this.amenityKeywords)) {
        amenities[field] = keywords.some((keyword) =>
          searchText.includes(keyword.toLowerCase()),
        );
      }

      const foundCount = Object.values(amenities).filter((v) => v === true).length;
      this.logger.log(`Pattern matching found ${foundCount} amenities`);

      // AI verification for ambiguous cases (where pattern matching found nothing)
      const notFound = Object.entries(amenities)
        .filter(([_, found]) => !found)
        .map(([field, _]) => field);

      if (notFound.length > 0 && (rawData || existingData.description || existingData.infra_description)) {
        this.logger.log(
          `Verifying ${notFound.length} ambiguous amenities with AI...`,
        );
        const aiVerified = await this.verifyWithAI(rawData, notFound);
        Object.assign(amenities, aiVerified);

        const aiFoundCount = Object.values(aiVerified).filter((v) => v === true).length;
        this.logger.log(`AI verification found ${aiFoundCount} additional amenities`);
      }

      const totalFound = Object.values(amenities).filter((v) => v === true).length;
      this.logger.log(`Total amenities extracted: ${totalFound}`);

      return amenities;
    } catch (error) {
      this.logger.error(
        `Error extracting amenities for kondo ${existingData.id}: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Build searchable text from existing Kondo fields
   * Used when scraped_raw_data is not available
   */
  private buildSearchTextFromKondo(kondo: Partial<Kondo>): string {
    const texts: string[] = [];

    // Collect all text fields
    if (kondo.name) texts.push(kondo.name);
    if (kondo.description) texts.push(kondo.description);
    if (kondo.infra_description) texts.push(kondo.infra_description);
    if (kondo.neighborhood) texts.push(kondo.neighborhood);
    if (kondo.city) texts.push(kondo.city);

    return texts.join(' ');
  }

  /**
   * Extract amenity keywords from media filenames
   * Filenames often contain descriptive amenity information
   * Example: "kondo-123-CELEBRATION_CLUBEPISCINA_v02.jpg" → "clube piscina"
   */
  private extractFromMediaFilenames(medias: any[]): string {
    const texts: string[] = [];

    for (const media of medias) {
      // Try storage_url first, fallback to filename
      const url = media.storage_url || media.filename;
      if (!url) continue;

      // Extract filename from URL
      const filename = this.extractFilename(url);

      // Clean filename: remove prefixes, extensions, version numbers
      const cleaned = this.cleanFilename(filename);

      // Skip very short or generic filenames
      if (cleaned.length < 4) continue;

      texts.push(cleaned);
    }

    this.logger.debug(`Extracted ${texts.length} descriptive filenames: ${texts.slice(0, 5).join(', ')}...`);

    return texts.join(' ');
  }

  /**
   * Extract filename from URL (last part after /)
   */
  private extractFilename(url: string): string {
    const parts = url.split('/');
    return parts[parts.length - 1];
  }

  /**
   * Clean filename to extract descriptive amenity keywords
   * Removes prefixes, extensions, version suffixes
   * Converts underscores/hyphens to spaces for matching
   */
  private cleanFilename(filename: string): string {
    // Remove common prefixes: "kondo-1767385247056-", "scraped-", etc.
    let cleaned = filename.replace(/^(kondo|scraped|media|image|photo|img)-\d+-?/gi, '');

    // Remove file extension
    cleaned = cleaned.replace(/\.(jpg|jpeg|png|webp|gif|mp4|mov|avi)$/i, '');

    // Remove version suffixes: "_v02", "_v2", "-v02", "_version2"
    cleaned = cleaned.replace(/[_-]?v(ersion)?\d+$/i, '');

    // Replace underscores and hyphens with spaces (for keyword matching)
    cleaned = cleaned.replace(/[_-]/g, ' ');

    return cleaned.trim();
  }

  /**
   * Flatten raw data object to searchable text
   * Handles nested objects, arrays, etc.
   */
  private flattenToText(obj: any, visited = new WeakSet()): string {
    if (!obj || typeof obj !== 'object') {
      return String(obj || '');
    }

    // Prevent circular references
    if (visited.has(obj)) {
      return '';
    }
    visited.add(obj);

    const texts: string[] = [];

    if (Array.isArray(obj)) {
      for (const item of obj) {
        texts.push(this.flattenToText(item, visited));
      }
    } else {
      for (const value of Object.values(obj)) {
        texts.push(this.flattenToText(value, visited));
      }
    }

    return texts.join(' ');
  }

  /**
   * Use AI to verify amenities from complex structures
   */
  private async verifyWithAI(
    rawData: any,
    fields: string[],
  ): Promise<Record<string, boolean>> {
    try {
      // Format field names to human-readable
      const fieldDescriptions = fields
        .map((f) => f.replace('infra_', '').replace(/_/g, ' '))
        .join(', ');

      const prompt = `Analyze this property data and determine which amenities are present:

Data: ${JSON.stringify(rawData, null, 2)}

Check for these amenities: ${fieldDescriptions}

Return ONLY a JSON object with true/false for each field. Use the exact field names provided.

Example format:
{
  "infra_pool": true,
  "infra_gym": false
}

IMPORTANT: Return ONLY the JSON object, no other text.`;

      const response = await this.grokService.generateResponse([
        {
          type: 'system',
          content:
            'You are a property data analyzer. Return only valid JSON objects.',
        },
        { type: 'human', content: prompt },
      ]);

      // Parse AI response
      const cleanedResponse = response
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .trim();

      const parsed = JSON.parse(cleanedResponse);

      // Validate response has the requested fields
      const result: Record<string, boolean> = {};
      for (const field of fields) {
        result[field] = parsed[field] === true;
      }

      return result;
    } catch (error) {
      this.logger.warn(
        `AI verification failed: ${error.message}. Returning all false.`,
      );
      // Return all false if AI verification fails
      const result: Record<string, boolean> = {};
      for (const field of fields) {
        result[field] = false;
      }
      return result;
    }
  }
}
