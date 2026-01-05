import { Injectable, Logger } from '@nestjs/common';
import { GrokService } from '../../agents/chatty/grok.service';
import { DescriptionGeneratorService } from './description-generator.service';
import { AmenityExtractorService } from './amenity-extractor.service';
import { Kondo } from '../../../kondo/entities/kondo.entity';
import {
  INFRA_DESCRIPTION_SYSTEM_PROMPT,
  buildInfraDescriptionPrompt,
} from '../prompts/description.prompts';

@Injectable()
export class FieldFillerService {
  private readonly logger = new Logger(FieldFillerService.name);

  constructor(
    private readonly grokService: GrokService,
    private readonly descriptionGenerator: DescriptionGeneratorService,
    private readonly amenityExtractor: AmenityExtractorService,
  ) {}

  /**
   * Fill missing fields intelligently
   * - description (lifestyle-focused)
   * - infra_description (amenities-focused)
   */
  async fill(
    rawData: any,
    existingData: Partial<Kondo>,
  ): Promise<Partial<Kondo>> {
    this.logger.log(
      `Filling missing fields for kondo: ${existingData.name} (ID: ${existingData.id})`,
    );

    const updates: Partial<Kondo> = {};

    try {
      // Fill main description (broader/generic lifestyle)
      if (!existingData.description || existingData.description.length < 50) {
        this.logger.log('Generating main description...');
        updates.description = await this.descriptionGenerator.generate(
          rawData,
          existingData,
        );
      } else {
        this.logger.log('Main description already exists, skipping');
      }

      // Fill infra_description (amenities-focused)
      if (!existingData.infra_description) {
        this.logger.log('Generating infrastructure description...');
        updates.infra_description = await this.generateInfraDescription(
          rawData,
          existingData,
        );
      } else {
        this.logger.log('Infrastructure description already exists, skipping');
      }

      this.logger.log(`Field filling complete. Updated fields: ${Object.keys(updates).join(', ')}`);

      return updates;
    } catch (error) {
      this.logger.error(
        `Error filling fields for kondo ${existingData.id}: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Generate infrastructure description (amenities-focused)
   * More factual than the main description
   */
  private async generateInfraDescription(
    rawData: any,
    existingData: Partial<Kondo>,
  ): Promise<string> {
    try {
      // Extract amenities from raw data
      const amenities = await this.amenityExtractor.extract(
        rawData,
        existingData,
      );

      // Get list of available amenities
      const amenityList = Object.entries(amenities)
        .filter(([_, value]) => value === true)
        .map(([key, _]) => this.formatAmenityName(key));

      if (amenityList.length === 0) {
        this.logger.warn('No amenities found, returning generic infra description');
        return '<p>Infraestrutura completa para seu conforto e qualidade de vida.</p>';
      }

      // Build prompt
      const prompt = buildInfraDescriptionPrompt(
        existingData.name || 'Condomínio',
        amenityList,
      );

      // Call AI
      const infraDesc = await this.grokService.generateResponse([
        { type: 'system', content: INFRA_DESCRIPTION_SYSTEM_PROMPT },
        { type: 'human', content: prompt },
      ]);

      // Clean HTML
      const cleaned = this.cleanHtmlDescription(infraDesc);

      this.logger.log(
        `Generated infra description: ${cleaned.length} characters`,
      );

      return cleaned;
    } catch (error) {
      this.logger.error(
        `Error generating infra description: ${error.message}`,
        error.stack,
      );
      // Return fallback
      return '<p>Infraestrutura completa com diversas opções de lazer e conveniência.</p>';
    }
  }

  /**
   * Format amenity field name to human-readable Portuguese
   */
  private formatAmenityName(field: string): string {
    const map: Record<string, string> = {
      infra_pool: 'Piscina',
      infra_gym: 'Academia',
      infra_sauna: 'Sauna',
      infra_party_saloon: 'Salão de Festas',
      infra_kids_area: 'Playground',
      infra_sports_court: 'Quadra Poliesportiva',
      infra_barbecue_zone: 'Churrasqueira',
      infra_gardens: 'Jardins',
      infra_lobby_24h: 'Portaria 24h',
      infra_security_team: 'Segurança',
      infra_home_office: 'Coworking',
      infra_bike_rack: 'Bicicletário',
      infra_pet_area: 'Pet Place',
      infra_laundry: 'Lavanderia',
      infra_parking_lot: 'Estacionamento',
      infra_gourmet_area: 'Área Gourmet',
      infra_living_space: 'Espaço de Convivência',
      infra_lounge_bar: 'Lounge Bar',
      infra_lagoon: 'Lagoa',
      infra_woods: 'Bosque',
      infra_vegetable_garden: 'Horta',
      infra_nature_trail: 'Trilha Ecológica',
      infra_generates_power: 'Energia Solar',
      infra_heliport: 'Heliponto',
      infra_interactive_lobby: 'Lobby Interativo',
      infra_wall: 'Murado',
      infra_grass_area: 'Área Verde',
      infra_market_nearby: 'Comércio Próximo',
      infra_eletricity: 'Energia Elétrica',
      infra_water: 'Abastecimento de Água',
      infra_sidewalks: 'Calçadas',
      infra_internet: 'Internet',
    };

    return map[field] || field.replace('infra_', '').replace(/_/g, ' ');
  }

  /**
   * Clean HTML description
   */
  private cleanHtmlDescription(text: string): string {
    let cleaned = text
      .replace(/```html\n?/g, '')
      .replace(/```\n?/g, '')
      .replace(/^["']|["']$/g, '')
      .trim();

    // Ensure <p> tags
    if (!cleaned.includes('<p>')) {
      cleaned = `<p>${cleaned}</p>`;
    }

    return cleaned;
  }
}
