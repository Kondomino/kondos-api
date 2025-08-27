import { Injectable, Logger } from '@nestjs/common';
import { VerificationService } from './verification.service';
import { ChattyAgent } from '../agents/chatty/chatty.agent';
import { DatabaseTool } from '../tools/database.tool';
import { MessageQueueService } from '../services/message-queue.service';
import { IncomingMessage, AgentResponse } from '../interfaces/agent.interface';
import { VerifiedMediaProcessorService } from '../../whatsapp/services/verified-media-processor.service';

@Injectable()
export class AgentOrchestrator {
  private readonly logger = new Logger(AgentOrchestrator.name);

  constructor(
    private readonly verificationService: VerificationService,
    private readonly chattyAgent: ChattyAgent,
    private readonly databaseTool: DatabaseTool,
    private readonly messageQueueService: MessageQueueService,
    private readonly verifiedMediaProcessor: VerifiedMediaProcessorService,
  ) {}

  async processMessage(message: IncomingMessage): Promise<AgentResponse> {
    try {
      this.logger.log(`Start orchestrating message ${message.whatsappMessageId} from ${message.phoneNumber}`);
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

      this.logger.log(`Verification result for ${message.phoneNumber}: isAgent=${verification.isRealEstateAgent} confidence=${verification.confidence}`);

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
        this.logger.log(`No existing agency for ${message.phoneNumber}. Creating from verification data...`);
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

      this.logger.log(`Using conversation ${conversation.id} for agency ${agency.id}`);

      // 4.5. Process media for verified users (NEW STEP)
      let processedContent = message.content;
      let enhancedMediaData = message.mediaData;
      let mediaProcessingMetadata = {};

      if (message.mediaData && (message.messageType === 'document' || message.messageType === 'image' || message.messageType === 'video')) {
        this.logger.log(`[ORCHESTRATOR] Media detected for verified agency ${agency.id}: type=${message.messageType} filename=${message.mediaData.filename}`);
        
        const mediaProcessStart = Date.now();
        const mediaResult = await this.verifiedMediaProcessor.processVerifiedUserMedia(
          message.messageType,
          message.mediaData,
          message.whatsappMessageId,
          agency.id
        );
        const mediaProcessTime = Date.now() - mediaProcessStart;

        if (mediaResult.shouldProcessMedia && mediaResult.processedContent) {
          processedContent = mediaResult.processedContent;
          enhancedMediaData = mediaResult.enhancedMediaData || message.mediaData;
          mediaProcessingMetadata = mediaResult.processingMetadata || {};
          
          this.logger.log(`[ORCHESTRATOR] Media processing SUCCESS in ${mediaProcessTime}ms: ${processedContent.length} chars extracted`);
          this.logger.log(`[ORCHESTRATOR] Enhanced content preview: "${processedContent.substring(0, 150)}${processedContent.length > 150 ? '...' : ''}"`);
        } else if (mediaResult.processedContent) {
          // Fallback content even if processing failed
          processedContent = mediaResult.processedContent;
          mediaProcessingMetadata = mediaResult.processingMetadata || {};
          
          this.logger.log(`[ORCHESTRATOR] Using fallback content after ${mediaProcessTime}ms for message ${message.whatsappMessageId}`);
        } else {
          this.logger.log(`[ORCHESTRATOR] No media processing performed in ${mediaProcessTime}ms for message ${message.whatsappMessageId}`);
        }
      }

      // 5. Instead of processing immediately, QUEUE the message
      // Create enhanced message with processed content
      const enhancedMessage: IncomingMessage = {
        ...message,
        content: processedContent,
        mediaData: enhancedMediaData,
      };

      const queueItem = await this.messageQueueService.enqueueMessage({
        message: enhancedMessage,
        conversationId: conversation.id,
        agencyId: agency.id,
        verificationMetadata: {
          verification_confidence: verification.confidence,
          verification_reasoning: verification.reasoning,
          agent_name: agency.name,
        },
      });

      this.logger.log(`Enqueued message ${queueItem.id} for conversation ${conversation.id}`);

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
          media_processing: mediaProcessingMetadata,
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
