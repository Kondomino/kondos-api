import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { RealEstateAgency } from '../../whatsapp/entities/real-estate-agency.entity';
import { VerificationResult } from '../interfaces/agent.interface';

@Injectable()
export class VerificationService {
  private readonly logger = new Logger(VerificationService.name);

  // Test whitelist - phone numbers that should always be treated as real estate agents
  private readonly testWhitelist = [
    '553172079049', // Victor's test number
    '553171669149', // Luiza
    // Add more test numbers here as needed
  ];

  // Real estate keywords in Portuguese
  private readonly realEstateKeywords = [
    'imoveis', 'imóveis', 'corretor', 'corretora', 'imobiliaria', 'imobiliária',
    'apartamento', 'casa', 'terreno', 'lote', 'condominio', 'condomínio',
    'venda', 'aluguel', 'locacao', 'locação', 'investimento', 'propriedade',
    'metro quadrado', 'm²', 'dormitorio', 'dormitório', 'suite', 'suíte',
    'garagem', 'vaga', 'financiamento', 'creci', 'planta', 'obra',
    'lancamento', 'lançamento', 'empreendimento', 'construtora'
  ];

  private readonly businessIndicators = [
    'whatsapp', 'contato', 'telefone', 'celular', 'email', 'site',
    'visita', 'apresentar', 'mostrar', 'oportunidade', 'negocio', 'negócio',
    'cliente', 'interessado', 'proposta', 'documentacao', 'documentação',
    'tabela', 'preco', 'preço', 'valor', 'oferta', 'promocao', 'promoção'
  ];

  constructor(
    @InjectModel(RealEstateAgency)
    private realEstateAgencyModel: typeof RealEstateAgency,
  ) {}

  async verifyAgent(
    phoneNumber: string, 
    messageContent: string,
    contactContext?: {
      contactName?: string;
      isBusinessAccount?: boolean;
      businessProfile?: {
        business_name?: string;
        website?: string[];
        email?: string;
        category?: string;
        description?: string;
      };
    }
  ): Promise<VerificationResult> {
    try {
      // 1. Check if agent already exists in database (always check this first)
      const existingAgency = await this.checkExistingAgency(phoneNumber);
      if (existingAgency) {
        this.logger.log(`Found existing real estate agency for phone: ${phoneNumber}`);
        return {
          isRealEstateAgent: true,
          confidence: 1.0,
          reasoning: 'Phone number found in real estate agencies database',
          shouldAskForClarification: false,
          existingAgency: {
            id: existingAgency.id,
            name: existingAgency.name,
            phone_number: existingAgency.phone_number,
          },
        };
      }

      // 2. Check test whitelist (for testing purposes)
      if (this.testWhitelist.includes(phoneNumber)) {
        this.logger.log(`Phone number ${phoneNumber} found in test whitelist - treating as real estate agent`);
        return {
          isRealEstateAgent: true,
          confidence: 1.0,
          reasoning: 'Phone number in test whitelist for development/testing',
          shouldAskForClarification: false,
        };
      }

      // 3. If not in database, check if it's a business account first
      if (contactContext?.isBusinessAccount) {
        const businessAnalysis = this.analyzeBusinessProfile(contactContext, messageContent);
        if (businessAnalysis.isRealEstateAgent) {
          this.logger.log(`Business account verified as real estate agent: ${phoneNumber}`);
          return businessAnalysis;
        }
      }

      // 4. If not a business account or business analysis failed, analyze message content
      const contentAnalysis = this.analyzeMessageContent(messageContent);
      
      this.logger.log(`Content analysis for phone ${phoneNumber}: confidence=${contentAnalysis.confidence}, keywords=${contentAnalysis.keywordMatches}`);

      // 5. Determine verification result based on confidence
      if (contentAnalysis.confidence >= 0.7) {
        return {
          isRealEstateAgent: true,
          confidence: contentAnalysis.confidence,
          reasoning: `High confidence based on real estate keywords: ${contentAnalysis.keywordMatches.join(', ')}`,
          shouldAskForClarification: false,
        };
      } else if (contentAnalysis.confidence >= 0.3) {
        return {
          isRealEstateAgent: false,
          confidence: contentAnalysis.confidence,
          reasoning: `Medium confidence - requires clarification. Keywords found: ${contentAnalysis.keywordMatches.join(', ')}`,
          shouldAskForClarification: true,
        };
      } else {
        return {
          isRealEstateAgent: false,
          confidence: contentAnalysis.confidence,
          reasoning: 'Low confidence - no significant real estate indicators found',
          shouldAskForClarification: false,
        };
      }
    } catch (error) {
      this.logger.error(`Error verifying agent for phone ${phoneNumber}:`, error);
      return {
        isRealEstateAgent: false,
        confidence: 0,
        reasoning: 'Error during verification process',
        shouldAskForClarification: false,
      };
    }
  }

  private async checkExistingAgency(phoneNumber: string): Promise<RealEstateAgency | null> {
    try {
      return await this.realEstateAgencyModel.findOne({
        where: { phone_number: phoneNumber },
      });
    } catch (error) {
      this.logger.error(`Error checking existing agency for phone ${phoneNumber}:`, error);
      return null;
    }
  }

  private analyzeBusinessProfile(
    contactContext: {
      contactName?: string;
      isBusinessAccount?: boolean;
      businessProfile?: {
        business_name?: string;
        website?: string[];
        email?: string;
        category?: string;
        description?: string;
      };
    },
    messageContent: string
  ): VerificationResult {
    const businessProfile = contactContext.businessProfile;
    const businessName = businessProfile?.business_name || contactContext.contactName || '';
    const category = businessProfile?.category || '';
    const description = businessProfile?.description || '';
    const website = businessProfile?.website?.join(' ') || '';
    const email = businessProfile?.email || '';

    // Combine all business profile text for analysis
    const businessText = `${businessName} ${category} ${description} ${website} ${email}`.toLowerCase();
    
    // Check for real estate indicators in business profile
    const realEstateMatches = this.realEstateKeywords.filter(keyword => 
      businessText.includes(keyword.toLowerCase())
    );

    // Check message content as well
    const messageAnalysis = this.analyzeMessageContent(messageContent);
    
    // Calculate confidence based on business profile and message
    let confidence = 0;
    let reasoning = '';

    if (realEstateMatches.length > 0) {
      confidence += 0.8; // High confidence from business profile
      reasoning = `Business profile contains real estate keywords: ${realEstateMatches.join(', ')}`;
    }

    // Add message content confidence (weighted less for business accounts)
    confidence += messageAnalysis.confidence * 0.3;

    if (messageAnalysis.keywordMatches.length > 0) {
      reasoning += ` Message also contains: ${messageAnalysis.keywordMatches.join(', ')}`;
    }

    // Real estate categories that are common
    const realEstateCategories = [
      'real estate', 'imobiliaria', 'imobiliária', 'corretor', 'corretora',
      'property', 'rental', 'aluguel', 'venda', 'housing'
    ];

    if (realEstateCategories.some(cat => category.toLowerCase().includes(cat))) {
      confidence = Math.max(confidence, 0.9);
      reasoning = `Business category indicates real estate: ${category}`;
    }

    return {
      isRealEstateAgent: confidence >= 0.6,
      confidence: Math.min(confidence, 1.0),
      reasoning,
      shouldAskForClarification: confidence < 0.6 && confidence > 0.3,
    };
  }

  private analyzeMessageContent(content: string): {
    confidence: number;
    keywordMatches: string[];
    businessIndicators: string[];
  } {
    const normalizedContent = content.toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, ''); // Remove accents

    // Find real estate keyword matches
    const keywordMatches = this.realEstateKeywords.filter(keyword => 
      normalizedContent.includes(keyword.toLowerCase())
    );

    // Find business indicator matches
    const businessMatches = this.businessIndicators.filter(indicator => 
      normalizedContent.includes(indicator.toLowerCase())
    );

    // Calculate confidence score
    let confidence = 0;

    // Real estate keywords have higher weight
    confidence += keywordMatches.length * 0.3;
    
    // Business indicators have medium weight
    confidence += businessMatches.length * 0.15;

    // Professional language patterns (bonus)
    if (this.hasBusinessLanguagePatterns(normalizedContent)) {
      confidence += 0.2;
    }

    // Contact information sharing (bonus)
    if (this.hasContactInformation(normalizedContent)) {
      confidence += 0.15;
    }

    // Cap confidence at 1.0
    confidence = Math.min(confidence, 1.0);

    return {
      confidence,
      keywordMatches,
      businessIndicators: businessMatches,
    };
  }

  private hasBusinessLanguagePatterns(content: string): boolean {
    const businessPatterns = [
      /trabalho com/,
      /atuo com/,
      /especializado em/,
      /ofereco/,
      /tenho disponivel/,
      /gostaria de apresentar/,
      /oportunidade de/,
      /entre em contato/,
    ];

    return businessPatterns.some(pattern => pattern.test(content));
  }

  private hasContactInformation(content: string): boolean {
    const contactPatterns = [
      /\(\d{2}\)\s*\d{4,5}-?\d{4}/, // Phone numbers
      /\d{2}\s*\d{4,5}-?\d{4}/, // Phone numbers without parentheses
      /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/, // Email
      /whatsapp/i,
      /wa\.me/,
    ];

    return contactPatterns.some(pattern => pattern.test(content));
  }

  async createAgencyFromVerification(
    phoneNumber: string, 
    messageContent: string, 
    confidence: number
  ): Promise<RealEstateAgency> {
    try {
      // Extract potential agency name from message content
      const agencyName = this.extractAgencyName(messageContent) || `Agência ${phoneNumber}`;

      const newAgency = await this.realEstateAgencyModel.create({
        name: agencyName,
        phone_number: phoneNumber,
        description: 'Auto-created from WhatsApp conversation',
        is_active: true,
        metadata: {
          created_from: 'agentic_verification',
          confidence_score: confidence,
          first_message: messageContent,
          verified_at: new Date(),
        },
      });

      this.logger.log(`Created new real estate agency: ${agencyName} (ID: ${newAgency.id})`);
      return newAgency;
    } catch (error) {
      this.logger.error(`Error creating agency for phone ${phoneNumber}:`, error);
      throw error;
    }
  }

  private extractAgencyName(content: string): string | null {
    // Try to extract agency name from common patterns
    const patterns = [
      /sou da (.+?)(?:\.|,|!|\s*$)/i,
      /trabalho na (.+?)(?:\.|,|!|\s*$)/i,
      /(.+?) imobiliaria/i,
      /imobiliaria (.+?)(?:\.|,|!|\s*$)/i,
      /(.+?) imoveis/i,
      /meu nome é (.+?)(?:\.|,|!|\s*da|\s*$)/i,
    ];

    for (const pattern of patterns) {
      const match = content.match(pattern);
      if (match && match[1]) {
        const name = match[1].trim();
        if (name.length > 2 && name.length < 50) {
          return name;
        }
      }
    }

    return null;
  }
}
