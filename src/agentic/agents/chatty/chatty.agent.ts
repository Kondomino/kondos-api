import { Injectable, Logger } from '@nestjs/common';
import { HumanMessage, SystemMessage } from '@langchain/core/messages';
import { RunnableSequence } from '@langchain/core/runnables';
import { CHATTY_SYSTEM_PROMPT, CONVERSATION_STARTERS, RESPONSE_TEMPLATES } from './chatty.prompts';
import { ConversationTool } from '../../tools/conversation.tool';
import { MessagePersistenceTool, RelevanceAssessmentTool } from '../../tools/message-persistence.tool';
import { DatabaseTool } from '../../tools/database.tool';
import { IncomingMessage, AgentResponse } from '../../interfaces/agent.interface';
import { GrokService } from './grok.service';

@Injectable()
export class ChattyAgent {
  private readonly logger = new Logger(ChattyAgent.name);
  private readonly chain: RunnableSequence;

  constructor(
    private readonly conversationTool: ConversationTool,
    private readonly messagePersistenceTool: MessagePersistenceTool,
    private readonly relevanceAssessmentTool: RelevanceAssessmentTool,
    private readonly databaseTool: DatabaseTool,
    private readonly grokService: GrokService,
  ) {
    this.chain = this.createConversationChain();
  }

  private async callGrokModel(messages: any[]): Promise<string> {
    try {
      return await this.grokService.generateResponse(messages);
    } catch (error) {
      this.logger.error(`Error calling Grok model: ${error.message}`, error.stack);
      throw error;
    }
  }

  private createConversationChain(): RunnableSequence {
    return RunnableSequence.from([
      async (input: { message: IncomingMessage; conversationId: number }) => {
        const history = await this.conversationTool.call({
          conversationId: input.conversationId,
          limit: 10,
        });
        const relevance = await this.relevanceAssessmentTool.call({
          messageContent: input.message.content,
        });
        return { ...input, history, relevance };
      },
      async (ctx: { message: IncomingMessage; conversationId: number; history: string; relevance: string }) => {
        const messages = [
          new SystemMessage(CHATTY_SYSTEM_PROMPT),
          new HumanMessage(`CONTEXTO DA CONVERSA:
${ctx.history}

MENSAGEM RECEBIDA:
${ctx.message.content}

ANÁLISE DE RELEVÂNCIA:
${ctx.relevance}

Responda como Victor Melo, mantendo a conversa natural e buscando informações sobre imóveis.`),
        ];
        const response = await this.callGrokModel(messages);
        return { response, conversationId: ctx.conversationId };
      },
      async (payload: { response: string; conversationId: number }) => {
        await this.messagePersistenceTool.call({
          conversationId: payload.conversationId,
          messageContent: payload.response,
          direction: 'outgoing',
          messageType: 'text',
          relevanceScore: 1,
        });

        return {
          shouldRespond: true,
          message: payload.response,
          messageType: 'text',
          conversationId: payload.conversationId,
        };
      },
    ]);
  }

  async processMessage(message: IncomingMessage, conversationId: number): Promise<AgentResponse> {
    try {
      const conversation = await this.databaseTool.findOrCreateConversation(
        Number(message.phoneNumber), // Convert phone number to numeric ID
        message.whatsappMessageId,
      );

      const response = await this.chain.invoke({
        message,
        conversationId: conversation.id,
      });

      return response;
    } catch (error) {
      this.logger.error(`Error processing message: ${error.message}`, error.stack);
      return {
        shouldRespond: false,
        message: 'Error processing message',
      };
    }
  }

  private selectRandomTemplate(templates: string[]): string {
    return templates[Math.floor(Math.random() * templates.length)];
  }

  private async saveMessageToDatabase(
    conversationId: number,
    content: string,
    direction: 'incoming' | 'outgoing',
    messageType: string = 'text',
  ): Promise<void> {
    try {
      await this.messagePersistenceTool.call({
        conversationId,
        messageContent: content,
        direction,
        messageType,
        relevanceScore: 1,
      });
    } catch (error) {
      this.logger.error(`Error saving message to database: ${error.message}`, error.stack);
    }
  }

  private async updateConversationMetadata(
    conversationId: number,
    metadata: any,
  ): Promise<void> {
    try {
      await this.databaseTool.updateConversationMetadata(conversationId, metadata);
    } catch (error) {
      this.logger.error(`Error updating conversation metadata: ${error.message}`, error.stack);
    }
  }
}