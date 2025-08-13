import { Injectable } from '@nestjs/common';
import { StructuredTool } from '@langchain/core/tools';
import { z } from 'zod';
import { DatabaseTool } from './database.tool';

// Schema for the conversation history tool input
const ConversationHistorySchema = z.object({
  conversationId: z.number().describe('The ID of the conversation to fetch history for'),
  limit: z.number().optional().default(20).describe('Maximum number of messages to retrieve (default: 20)'),
});

@Injectable()
export class ConversationTool extends StructuredTool<any, any, any, string> {
  name = 'get_conversation_history';
  description = 'Fetches the conversation history for a specific conversation ID. Returns the last N messages in chronological order with sender information.';
  schema: any = ConversationHistorySchema as any;

  constructor(private readonly databaseTool: DatabaseTool) {
    super();
  }

  protected async _call(
    input: any,
    _runManager?: any,
    _parentConfig?: any,
  ): Promise<string> {
    try {
      const context = await this.databaseTool.getConversationContext(
        input.conversationId,
        input.limit
      );

      if (!context) {
        return `No conversation found with ID ${input.conversationId}`;
      }

      // Format the conversation history for the AI agent
      const formattedHistory = context.messageHistory
        .map(msg => {
          const sender = msg.direction === 'incoming' ? 'Cliente' : 'Victor';
          const timestamp = new Date(msg.timestamp).toLocaleString('pt-BR');
          return `[${timestamp}] ${sender}: ${msg.content}`;
        })
        .join('\n');

      const summary = {
        conversationId: context.conversationId,
        agencyId: context.agencyId,
        agentName: context.agentName || 'Não informado',
        totalMessages: context.messageHistory.length,
        lastInteraction: new Date(context.lastInteraction).toLocaleString('pt-BR'),
        history: formattedHistory,
      };

      return `HISTÓRICO DA CONVERSA:
Conversa ID: ${summary.conversationId}
Agência ID: ${summary.agencyId}
Nome do Corretor: ${summary.agentName}
Total de Mensagens: ${summary.totalMessages}
Última Interação: ${summary.lastInteraction}

MENSAGENS:
${summary.history || 'Nenhuma mensagem encontrada.'}`;

    } catch (error) {
      return `Erro ao buscar histórico da conversa: ${error.message}`;
    }
  }
}

// Schema for the conversation summary tool
const ConversationSummarySchema = z.object({
  conversationId: z.number().describe('The ID of the conversation to summarize'),
});

@Injectable()
export class ConversationSummaryTool extends StructuredTool<any, any, any, string> {
  name = 'get_conversation_summary';
  description = 'Gets a summary of the conversation including key information about properties discussed, client interests, and important details shared.';
  schema: any = ConversationSummarySchema as any;

  constructor(private readonly databaseTool: DatabaseTool) {
    super();
  }

  protected async _call(
    input: any,
    _runManager?: any,
    _parentConfig?: any,
  ): Promise<string> {
    try {
      const context = await this.databaseTool.getConversationContext(input.conversationId, 50);

      if (!context) {
        return `No conversation found with ID ${input.conversationId}`;
      }

      // Extract key information from the conversation
      const allMessages = context.messageHistory.map(msg => msg.content).join(' ');
      
      // Look for property-related information
      const propertyKeywords = [
        'apartamento', 'casa', 'terreno', 'lote', 'condomínio', 'empreendimento',
        'dormitório', 'quarto', 'suite', 'garagem', 'vaga', 'm²', 'metro',
        'preço', 'valor', 'financiamento', 'entrada', 'parcela'
      ];

      const mentionedKeywords = propertyKeywords.filter(keyword => 
        allMessages.toLowerCase().includes(keyword.toLowerCase())
      );

      // Count message types
      const incomingCount = context.messageHistory.filter(msg => msg.direction === 'incoming').length;
      const outgoingCount = context.messageHistory.filter(msg => msg.direction === 'outgoing').length;

      return `RESUMO DA CONVERSA:
Conversa ID: ${context.conversationId}
Agência: ${context.agentName || 'Não informado'}
Mensagens do Cliente: ${incomingCount}
Mensagens do Victor: ${outgoingCount}
Última Interação: ${new Date(context.lastInteraction).toLocaleString('pt-BR')}

TÓPICOS MENCIONADOS:
${mentionedKeywords.length > 0 ? mentionedKeywords.join(', ') : 'Nenhum tópico específico identificado'}

STATUS: ${incomingCount > outgoingCount ? 'Cliente mais ativo' : 'Conversa equilibrada'}`;

    } catch (error) {
      return `Erro ao gerar resumo da conversa: ${error.message}`;
    }
  }
}
