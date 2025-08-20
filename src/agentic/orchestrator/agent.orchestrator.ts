import { Injectable, Logger } from '@nestjs/common';
import { VerificationService } from './verification.service';
import { ChattyAgent } from '../agents/chatty/chatty.agent';
import { DatabaseTool } from '../tools/database.tool';
import { MessageQueueService } from '../services/message-queue.service';
import { IncomingMessage, AgentResponse } from '../interfaces/agent.interface';

@Injectable()
export class AgentOrchestrator {
  private readonly logger = new Logger(AgentOrchestrator.name);

  constructor(
    private readonly verificationService: VerificationService,
    private readonly chattyAgent: ChattyAgent,
    private readonly databaseTool: DatabaseTool,
    private readonly messageQueueService: MessageQueueService,
  ) {}

  async processMessage(message: IncomingMessage): Promise<AgentResponse> {
    try {
      // Log business account information if available
      if (message.contactContext?.isBusinessAccount) {
        this.logger.log(`Processing message from business account: ${message.contactContext.contactName || message.phoneNumber}`);
        if (message.contactContext.businessProfile) {
          this.logger.log(`Business details - Name: ${message.contactContext.businessProfile.business_name}, Category: ${message.contactContext.businessProfile.category}`);
        }
      }

      // 1. Verify if sender is a real estate agent
      const verification = await this.verificationService.verifyAgent(
        message.phoneNumber,
        message.content,
        message.contactContext,
      );

      // 2. If not a real estate agent, return without response
      if (!verification.isRealEstateAgent) {
        this.logger.log(`Non-real estate agent message from ${message.phoneNumber}. Ignoring.`);
        return {
          shouldRespond: false,
          message: 'Not a real estate agent',
        };
      }

      // 3. If verified, ensure agent exists in database
      let agency = verification.existingAgency;
      if (!agency) {
        const newAgency = await this.verificationService.createAgencyFromVerification(
          message.phoneNumber,
          message.content,
          verification.confidence,
        );
        agency = {
          id: newAgency.id,
          name: newAgency.name,
          phone_number: newAgency.phone_number,
        };
      }

      // 4. Get or create conversation
      const conversation = await this.databaseTool.findOrCreateConversation(
        agency.id,
        message.phoneNumber,
      );

      // 5. Instead of processing immediately, QUEUE the message
      await this.messageQueueService.enqueueMessage({
        message,
        conversationId: conversation.id,
        agencyId: agency.id,
        verificationMetadata: {
          verification_confidence: verification.confidence,
          verification_reasoning: verification.reasoning,
          agent_name: agency.name,
        },
      });

      // 6. Return "no response" - let user hang, queue will process later
      return {
        shouldRespond: false,
        message: 'Message queued for processing',
        agencyId: agency.id,
        conversationId: conversation.id,
        metadata: {
          queued: true,
          verification_confidence: verification.confidence,
          verification_reasoning: verification.reasoning,
          agent_name: agency.name,
        },
      };

    } catch (error) {
      this.logger.error(`Error processing message in orchestrator: ${error.message}`, error.stack);
      return {
        shouldRespond: false,
        message: 'Error processing message',
      };
    }
  }
}
