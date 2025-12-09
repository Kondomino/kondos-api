import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { MessageQueue } from '../entities/message-queue.entity';
import { ChattyAgent } from '../agents/chatty/chatty.agent';
import { OutboundWhatsAppClient } from './outbound-whatsapp.client';
import { IncomingMessage } from '../interfaces/agent.interface';

@Injectable()
export class MessageQueueService {
  private readonly logger = new Logger(MessageQueueService.name);
  private isProcessing = false;
  private lastProcessedAt: Date | null = null;
  private readonly DELAY_THRESHOLD = 60000; // 60 seconds
  private readonly PROCESS_INTERVAL = 10000; // Check queue every 10 seconds

  constructor(
    @InjectModel(MessageQueue)
    private messageQueueModel: typeof MessageQueue,
    private readonly chattyAgent: ChattyAgent,
    private readonly outboundClient: OutboundWhatsAppClient,
  ) {
    // Start processing queue on service initialization
    //this.startQueueProcessor();
    this.logger.log('MessageQueueService initialized with 60-second rate limiting');
  }

  async enqueueMessage(data: {
    message: IncomingMessage;
    conversationId: number;
    agencyId: number;
    verificationMetadata: {
      verification_confidence: number;
      verification_reasoning: string;
      agent_name: string;
    };
  }): Promise<MessageQueue> {
    const queueItem = await this.messageQueueModel.create({
      phoneNumber: data.message.phoneNumber,
      messageContent: data.message.content,
      whatsappMessageId: data.message.whatsappMessageId,
      conversationId: data.conversationId,
      agencyId: data.agencyId,
      messageData: {
        messageType: data.message.messageType,
        mediaData: data.message.mediaData,
        contactContext: data.message.contactContext,
      },
      verificationMetadata: {
        confidence: data.verificationMetadata.verification_confidence,
        reasoning: data.verificationMetadata.verification_reasoning,
        agentName: data.verificationMetadata.agent_name,
      },
      status: 'pending',
    });

    this.logger.log(`Message queued: ${queueItem.id} from ${data.message.phoneNumber}`);
    return queueItem;
  }

  private startQueueProcessor(): void {
    // Process queue every 10 seconds
    setInterval(async () => {
      if (!this.isProcessing) {
        await this.processQueue();
      }
    }, this.PROCESS_INTERVAL);

    this.logger.log(`Queue processor started, checking every ${this.PROCESS_INTERVAL}ms`);
  }

  private async processQueue(): Promise<void> {
    this.isProcessing = true;

    try {
      // Check if we need to wait due to rate limiting
      if (this.shouldWaitForRateLimit()) {
        const remainingWait = this.getRemainingWaitTime();
        this.logger.log(`Rate limit active, waiting ${Math.ceil(remainingWait / 1000)}s more...`);
        this.isProcessing = false;
        return;
      }

      // Get next pending message (FIFO)
      const nextMessage = await this.messageQueueModel.findOne({
        where: { status: 'pending' },
        order: [['createdAt', 'ASC']],
      });

      if (!nextMessage) {
        this.isProcessing = false;
        return;
      }

      await this.processMessage(nextMessage);
      this.lastProcessedAt = new Date();

    } catch (error) {
      this.logger.error('Error in queue processor:', error);
    } finally {
      this.isProcessing = false;
    }
  }

  private shouldWaitForRateLimit(): boolean {
    if (!this.lastProcessedAt) return false;
    
    const timeSinceLastProcess = Date.now() - this.lastProcessedAt.getTime();
    return timeSinceLastProcess < this.DELAY_THRESHOLD;
  }

  private getRemainingWaitTime(): number {
    if (!this.lastProcessedAt) return 0;
    
    const timeSinceLastProcess = Date.now() - this.lastProcessedAt.getTime();
    return Math.max(0, this.DELAY_THRESHOLD - timeSinceLastProcess);
  }

  private async processMessage(queueItem: MessageQueue): Promise<void> {
    try {
      // Mark as processing
      await queueItem.update({ status: 'processing' });

      this.logger.log(`Processing queued message: ${queueItem.id} from ${queueItem.phoneNumber}`);

      // Reconstruct the IncomingMessage object
      const message: IncomingMessage = {
        phoneNumber: queueItem.phoneNumber,
        content: queueItem.messageContent,
        messageType: queueItem.messageData.messageType as any,
        timestamp: queueItem.createdAt,
        whatsappMessageId: queueItem.whatsappMessageId,
        mediaData: queueItem.messageData.mediaData,
        contactContext: queueItem.messageData.contactContext,
      };

      // Process with ChattyAgent (calls Grok API)
      const response = await this.chattyAgent.processMessage(message, queueItem.conversationId);

      if (response.shouldRespond && response.message) {
        // Send WhatsApp response via outbound client
        await this.outboundClient.send({
          to: queueItem.phoneNumber,
          type: (response.messageType as any) || 'text',
          text: response.message,
        });

        // Mark as completed
        await queueItem.update({
          status: 'completed',
          processedAt: new Date(),
          grokResponse: response.message,
        });

        this.logger.log(`Message ${queueItem.id} processed successfully - response sent to ${queueItem.phoneNumber}`);
      } else {
        throw new Error('ChattyAgent returned no response');
      }

    } catch (error) {
      await this.handleProcessingError(queueItem, error);
    }
  }

  private async handleProcessingError(queueItem: MessageQueue, error: Error): Promise<void> {
    const newRetryCount = queueItem.retryCount + 1;

    if (newRetryCount <= queueItem.maxRetries) {
      // Retry: reset to pending
      await queueItem.update({
        status: 'pending',
        retryCount: newRetryCount,
        errorMessage: error.message,
      });

      this.logger.warn(`Message ${queueItem.id} failed, retrying (${newRetryCount}/${queueItem.maxRetries}): ${error.message}`);
    } else {
      // Max retries reached: mark as failed and die silently
      await queueItem.update({
        status: 'failed',
        retryCount: newRetryCount,
        errorMessage: error.message,
        processedAt: new Date(),
      });

      this.logger.error(`Message ${queueItem.id} failed permanently after ${queueItem.maxRetries} retries: ${error.message}`);
      // Dies silently - no response sent to user
    }
  }

  // Utility method to get queue stats (for debugging)
  async getQueueStats(): Promise<{
    pending: number;
    processing: number;
    completed: number;
    failed: number;
    total: number;
  }> {
    const stats = await this.messageQueueModel.findAll({
      attributes: [
        'status',
        [this.messageQueueModel.sequelize.fn('COUNT', '*'), 'count']
      ],
      group: ['status'],
      raw: true,
    });

    const result = {
      pending: 0,
      processing: 0,
      completed: 0,
      failed: 0,
      total: 0,
    };

    stats.forEach((stat: any) => {
      result[stat.status] = parseInt(stat.count);
      result.total += parseInt(stat.count);
    });

    return result;
  }
}
