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

  // High-confidence keywords - Definitive real estate terms (0.7 weight)
  // These words strongly indicate real estate agent identity
  private readonly realEstateKeywords = [
    'imovel', 'imóvel', 'empreendimento', 'condominio', 'condomínio',
    'casa', 'lote', 'terreno', 'imobiliaria', 'imobiliário', 'lançamento',
    'lancamento', 'construtora', 'obra', 'obras'
  ];

  // Low-confidence keywords - General real estate/business terms (0.3 weight)
  // These can appear in real estate context but are less definitive
  private readonly possibleRealEstateKeywords = [
    // Additional real estate terms
    'corretor', 'corretora', 'apartamento', 'venda', 'aluguel', 'locacao', 'locação',
    'investimento', 'propriedade', 'metro quadrado', 'm²', 'dormitorio', 'dormitório',
    'suite', 'suíte', 'garagem', 'vaga', 'financiamento', 'creci', 'planta',
    // Business indicators
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
      // 1. Check if agent already exists in database
      const existingAgency = await this.checkExistingAgency(phoneNumber);
      if (existingAgency) {
        this.logger.log(`Found existing real estate agency for phone: ${phoneNumber}`);
        return this.createVerifiedResult(existingAgency);
      }

      // 2. Check test whitelist
      if (this.testWhitelist.includes(phoneNumber)) {
        this.logger.log(`Phone number ${phoneNumber} found in test whitelist`);
        return this.createWhitelistResult();
      }

      // 3. Check business account
      if (contactContext?.isBusinessAccount) {
        const businessAnalysis = this.analyzeBusinessProfile(contactContext, messageContent);
        if (businessAnalysis.isRealEstateAgent) {
          this.logger.log(`Business account verified as real estate agent: ${phoneNumber}`);
          return businessAnalysis;
        }
      }

      // 4. Analyze message content
      const contentAnalysis = this.analyzeMessageContent(messageContent);
      this.logger.log(
        `Content analysis for phone ${phoneNumber}: confidence=${contentAnalysis.confidence}, ` +
        `highConfidenceKeywords=${contentAnalysis.keywordMatches.length}, ` +
        `lowConfidenceKeywords=${contentAnalysis.businessIndicators.length}`
      );

      // 5. Determine result based on confidence
      if (contentAnalysis.confidence >= 0.7) {
        return this.createHighConfidenceResult(contentAnalysis.keywordMatches);
      } else if (contentAnalysis.confidence >= 0.3 && contentAnalysis.confidence < 0.7) {
        return this.createMediumConfidenceResult(contentAnalysis.confidence, contentAnalysis.keywordMatches);
      } else {
        return this.createLowConfidenceResult();
      }
    } catch (error) {
      this.logger.error(`Error verifying agent for phone ${phoneNumber}:`, error);
      return this.createErrorResult();
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
    
    // Separate high-confidence and low-confidence keyword matches
    const highConfidenceMatches = this.realEstateKeywords.filter(keyword => 
      businessText.includes(keyword.toLowerCase())
    );
    const lowConfidenceMatches = this.possibleRealEstateKeywords.filter(keyword => 
      businessText.includes(keyword.toLowerCase())
    );

    // Check message content as well
    const messageAnalysis = this.analyzeMessageContent(messageContent);
    
    // Calculate confidence based on business profile and message
    let confidence = 0;
    let reasoning = '';

    if (highConfidenceMatches.length > 0) {
      confidence += 0.85; // Very high confidence from high-confidence keywords
      reasoning = `Business profile contains definitive real estate keywords: ${highConfidenceMatches.join(', ')}`;
    }

    if (lowConfidenceMatches.length > 0) {
      confidence += 0.3; // Lower confidence from general business keywords
      if (reasoning) reasoning += `. Also contains: ${lowConfidenceMatches.join(', ')}`;
      else reasoning = `Business profile contains real estate indicators: ${lowConfidenceMatches.join(', ')}`;
    }

    // Add message content confidence (weighted less for business accounts)
    confidence += messageAnalysis.confidence * 0.3;

    // Real estate categories that are common
    const realEstateCategories = [
      'real estate', 'imobiliaria', 'imobiliária', 'corretor', 'corretora',
      'property', 'rental', 'aluguel', 'venda', 'housing'
    ];

    if (realEstateCategories.some(cat => category.toLowerCase().includes(cat))) {
      confidence = Math.max(confidence, 0.9);
      reasoning = `Business category indicates real estate: ${category}`;
    }

    const finalConfidence = Math.min(confidence, 1.0);
    return this.createBusinessProfileResult(finalConfidence, reasoning);
  }

  private analyzeMessageContent(content: string): {
    confidence: number;
    keywordMatches: string[];
    businessIndicators: string[];
  } {
    const normalizedContent = content.toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, ''); // Remove accents

    // Find high-confidence keyword matches (definitive real estate terms)
    const highConfidenceMatches = this.realEstateKeywords.filter(keyword => 
      normalizedContent.includes(keyword.toLowerCase())
    );

    // Find low-confidence keyword matches (general business/real estate terms)
    const lowConfidenceMatches = this.possibleRealEstateKeywords.filter(indicator => 
      normalizedContent.includes(indicator.toLowerCase())
    );

    // Calculate confidence score
    let confidence = 0;

    // High-confidence keywords have much higher weight (definitive real estate)
    confidence += highConfidenceMatches.length * 0.7;
    
    // Low-confidence keywords have lower weight (general business terms)
    confidence += lowConfidenceMatches.length * 0.3;

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
      keywordMatches: highConfidenceMatches.length > 0 ? highConfidenceMatches : lowConfidenceMatches,
      businessIndicators: lowConfidenceMatches,
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

  // ============================================================================
  // Factory methods for creating verification results
  // ============================================================================

  private createVerifiedResult(agency: RealEstateAgency): VerificationResult {
    return {
      isRealEstateAgent: true,
      confidence: 1.0,
      reasoning: 'Phone number found in real estate agencies database',
      shouldAskForClarification: false,
      existingAgency: {
        id: agency.id,
        name: agency.name,
        phone_number: agency.phone_number,
      },
    };
  }

  private createWhitelistResult(): VerificationResult {
    return {
      isRealEstateAgent: true,
      confidence: 1.0,
      reasoning: 'Phone number in test whitelist for development/testing',
      shouldAskForClarification: false,
    };
  }

  private createHighConfidenceResult(keywords: string[]): VerificationResult {
    return {
      isRealEstateAgent: true,
      confidence: 1.0,
      reasoning: `High confidence based on real estate keywords: ${keywords.join(', ')}`,
      shouldAskForClarification: false,
    };
  }

  private createMediumConfidenceResult(confidence: number, keywords: string[]): VerificationResult {
    return {
      isRealEstateAgent: false,
      confidence,
      reasoning: `Medium confidence - requires clarification. Keywords found: ${keywords.join(', ')}`,
      shouldAskForClarification: true,
      clarificationPrompt: 'Opa, tudo bem? Como posso ajudar?',
    };
  }

  private createLowConfidenceResult(): VerificationResult {
    return {
      isRealEstateAgent: false,
      confidence: 0,
      reasoning: 'Low confidence - no significant real estate indicators found',
      shouldAskForClarification: false,
    };
  }

  private createErrorResult(): VerificationResult {
    return {
      isRealEstateAgent: false,
      confidence: 0,
      reasoning: 'Error during verification process',
      shouldAskForClarification: false,
    };
  }

  private createBusinessProfileResult(confidence: number, reasoning: string): VerificationResult {
    const needsClarification = confidence < 0.6 && confidence > 0.3;
    return {
      isRealEstateAgent: confidence >= 0.6,
      confidence,
      reasoning,
      shouldAskForClarification: needsClarification,
      clarificationPrompt: needsClarification ? 'Opa, tudo bem? Como posso ajudar?' : undefined,
    };
  }
}
