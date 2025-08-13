import { Injectable, Logger } from '@nestjs/common';
import { AgentOrchestrator } from './orchestrator/agent.orchestrator';
import { IncomingMessage, AgentResponse } from './interfaces/agent.interface';

@Injectable()
export class AgenticService {
  private readonly logger = new Logger(AgenticService.name);

  constructor(
    private readonly agentOrchestrator: AgentOrchestrator,
  ) {}

  async processIncomingMessage(
    phoneNumber: string,
    content: string,
    messageType: string = 'text',
    whatsappMessageId: string,
    mediaData?: any,
  ): Promise<AgentResponse> {
    try {
      const message: IncomingMessage = {
        phoneNumber,
        content,
        messageType: messageType as any, // Type assertion since we know the types match
        timestamp: new Date(),
        whatsappMessageId,
        mediaData,
      };

      const response = await this.agentOrchestrator.processMessage(message);
      
      this.logger.log(`Processed message from ${phoneNumber}. Should respond: ${response.shouldRespond}`);
      
      return response;
    } catch (error) {
      this.logger.error(`Error processing incoming message: ${error.message}`, error.stack);
      return {
        shouldRespond: false,
        message: 'Error processing message',
      };
    }
  }
}
