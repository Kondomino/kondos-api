import { Injectable } from '@nestjs/common';
import { StructuredTool } from '@langchain/core/tools';
import { z } from 'zod';
import { DatabaseTool } from './database.tool';

// Schema for the message persistence tool
const MessagePersistenceSchema = z.object({
  conversationId: z.number().describe('The ID of the conversation'),
  messageContent: z.string().describe('The content of the message to save'),
  direction: z.enum(['incoming', 'outgoing']).describe('Message direction: incoming (from client) or outgoing (from Victor)'),
  messageType: z.string().optional().default('text').describe('Type of message (text, image, document, etc.)'),
  relevanceScore: z.number().min(0).max(1).optional().describe('Relevance score of the message (0-1)'),
  metadata: z.record(z.any()).optional().describe('Additional metadata for the message'),
});

@Injectable()
export class MessagePersistenceTool extends StructuredTool<any, any, any, string> {
  name = 'save_message';
  description = 'Saves a message to the database. Use this tool to persist important messages from the conversation, especially those containing real estate information, property details, or client preferences.';
  schema: any = MessagePersistenceSchema as any;

  constructor(private readonly databaseTool: DatabaseTool) {
    super();
  }

  protected async _call(
    input: any,
    _runManager?: any,
    _parentConfig?: any,
  ): Promise<string> {
    try {
      // Check if message is relevant enough to save
      const minRelevanceThreshold = 0.3;
      if (input.relevanceScore && input.relevanceScore < minRelevanceThreshold) {
        return `Message not saved - relevance score ${input.relevanceScore} below threshold ${minRelevanceThreshold}`;
      }

      // Generate a unique WhatsApp message ID for internal messages
      const whatsappMessageId = `agentic_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      // Prepare metadata
      const messageMetadata = {
        ...input.metadata,
        relevance_score: input.relevanceScore,
        saved_by: 'agentic_agent',
        saved_at: new Date().toISOString(),
        message_source: input.direction === 'outgoing' ? 'victor_melo' : 'real_estate_agent',
      };

      // Save the message
      const savedMessage = await this.databaseTool.saveMessage(
        input.conversationId,
        whatsappMessageId,
        input.direction,
        input.messageType,
        input.messageContent,
        { metadata: messageMetadata }
      );

      return `Message saved successfully with ID ${savedMessage.id}. Content: "${input.messageContent.substring(0, 100)}${input.messageContent.length > 100 ? '...' : ''}"`;

    } catch (error) {
      return `Error saving message: ${error.message}`;
    }
  }
}

// Schema for relevance assessment tool
const RelevanceAssessmentSchema = z.object({
  messageContent: z.string().describe('The message content to assess for relevance'),
  conversationContext: z.string().optional().describe('Additional context about the conversation'),
});

@Injectable()
export class RelevanceAssessmentTool extends StructuredTool<any, any, any, string> {
  name = 'assess_message_relevance';
  description = 'Assesses how relevant a message is for saving to the database. Returns a relevance score and reasoning.';
  schema: any = RelevanceAssessmentSchema as any;

  constructor() {
    super();
  }

  protected async _call(
    input: any,
    _runManager?: any,
    _parentConfig?: any,
  ): Promise<string> {
    try {
      const content = input.messageContent.toLowerCase();
      let relevanceScore = 0;
      const reasons: string[] = [];

      // Real estate content indicators (high relevance)
      const highRelevanceKeywords = [
        'apartamento', 'casa', 'terreno', 'lote', 'condomínio', 'empreendimento',
        'preço', 'valor', 'investimento', 'financiamento', 'documentação',
        'visita', 'apresentar', 'mostrar', 'planta', 'projeto', 'obra'
      ];

      const highMatches = highRelevanceKeywords.filter(keyword => content.includes(keyword));
      if (highMatches.length > 0) {
        relevanceScore += Math.min(highMatches.length * 0.2, 0.6);
        reasons.push(`Contém palavras-chave de alto valor: ${highMatches.join(', ')}`);
      }

      // Property details (high relevance)
      const propertyDetails = [
        'm²', 'metro', 'dormitório', 'quarto', 'suite', 'banheiro',
        'garagem', 'vaga', 'sacada', 'varanda', 'piscina', 'academia'
      ];

      const detailMatches = propertyDetails.filter(detail => content.includes(detail));
      if (detailMatches.length > 0) {
        relevanceScore += Math.min(detailMatches.length * 0.15, 0.4);
        reasons.push(`Contém detalhes de propriedade: ${detailMatches.join(', ')}`);
      }

      // Contact information sharing (medium relevance)
      if (content.includes('contato') || content.includes('telefone') || content.includes('whatsapp')) {
        relevanceScore += 0.3;
        reasons.push('Compartilhamento de informações de contato');
      }

      // Location information (medium relevance)
      const locationKeywords = ['bairro', 'região', 'zona', 'centro', 'próximo', 'perto'];
      const locationMatches = locationKeywords.filter(loc => content.includes(loc));
      if (locationMatches.length > 0) {
        relevanceScore += 0.2;
        reasons.push('Informações de localização');
      }

      // Numbers (potentially prices or measurements - medium relevance)
      if (/\d+/.test(content) && (content.includes('mil') || content.includes('reais') || content.includes('r$'))) {
        relevanceScore += 0.25;
        reasons.push('Informações financeiras/preços');
      }

      // Greetings and small talk (low relevance)
      const smallTalk = ['oi', 'olá', 'bom dia', 'boa tarde', 'boa noite', 'tudo bem', 'obrigado'];
      const smallTalkMatches = smallTalk.filter(greeting => content.includes(greeting));
      if (smallTalkMatches.length > 0 && content.length < 50) {
        relevanceScore = Math.max(relevanceScore - 0.3, 0);
        reasons.push('Conversa casual/cumprimentos');
      }

      // Cap relevance score at 1.0
      relevanceScore = Math.min(relevanceScore, 1.0);

      const assessment = {
        relevance_score: relevanceScore,
        should_save: relevanceScore >= 0.3,
        reasoning: reasons.length > 0 ? reasons.join('; ') : 'Nenhum indicador específico encontrado',
        message_preview: input.messageContent.substring(0, 100),
      };

      return `AVALIAÇÃO DE RELEVÂNCIA:
Pontuação: ${assessment.relevance_score.toFixed(2)}
Deve Salvar: ${assessment.should_save ? 'Sim' : 'Não'}
Motivos: ${assessment.reasoning}
Prévia: "${assessment.message_preview}${input.messageContent.length > 100 ? '...' : ''}"`;

    } catch (error) {
      return `Erro ao avaliar relevância: ${error.message}`;
    }
  }
}
