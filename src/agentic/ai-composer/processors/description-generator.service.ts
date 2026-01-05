import { Injectable, Logger } from '@nestjs/common';
import { GrokService } from '../../agents/chatty/grok.service';
import {
  DESCRIPTION_SYSTEM_PROMPT,
  buildDescriptionPrompt,
} from '../prompts/description.prompts';
import { Kondo } from '../../../kondo/entities/kondo.entity';

@Injectable()
export class DescriptionGeneratorService {
  private readonly logger = new Logger(DescriptionGeneratorService.name);

  constructor(private readonly grokService: GrokService) {}

  /**
   * Generate a professional, HTML-formatted property description
   * @param rawData - The scraped_raw_data (optional, not used - uses existingData instead)
   * @param existingData - Current kondo entity data
   * @returns HTML-formatted description with <p> tags
   */
  async generate(
    rawData: any,
    existingData: Partial<Kondo>,
  ): Promise<string> {
    this.logger.log(
      `Generating description for kondo: ${existingData.name} (ID: ${existingData.id})`,
    );

    if (!rawData) {
      this.logger.log('No scraped_raw_data available, using existing kondo fields for description generation');
    }

    try {
      // Prepare clean kondo data for AI (same structure as update.kondos.description.ts)
      const kondoData = this.prepareKondoData(existingData);

      // Build prompt
      const prompt = buildDescriptionPrompt(kondoData);

      // Call Grok API
      const messages = [
        { type: 'system', content: DESCRIPTION_SYSTEM_PROMPT },
        { type: 'human', content: prompt },
      ];

      const description = await this.grokService.generateResponse(messages);

      // Clean and validate HTML output
      const cleanedDescription = this.cleanHtmlDescription(description);

      this.logger.log(
        `Generated description: ${cleanedDescription.length} characters`,
      );

      return cleanedDescription;
    } catch (error) {
      this.logger.error(
        `Error generating description for kondo ${existingData.id}: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Prepare kondo data for AI (clean JSON representation)
   * Same structure as update.kondos.description.ts
   */
  private prepareKondoData(kondo: Partial<Kondo>): any {
    return {
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
      video: kondo.video,
    };
  }

  /**
   * Clean HTML description output from AI
   * - Remove markdown code blocks if present
   * - Ensure proper <p> tag wrapping
   * - Remove extra quotes or formatting
   */
  private cleanHtmlDescription(text: string): string {
    // Remove markdown code blocks
    let cleaned = text
      .replace(/```html\n?/g, '')
      .replace(/```\n?/g, '')
      .replace(/^["']|["']$/g, '') // Remove surrounding quotes
      .trim();

    // Ensure proper <p> tag wrapping if missing
    if (!cleaned.includes('<p>')) {
      const paragraphs = cleaned.split('\n\n').filter((p) => p.trim());
      cleaned = paragraphs.map((p) => `<p>${p.trim()}</p>`).join('\n');
    }

    return cleaned;
  }
}
