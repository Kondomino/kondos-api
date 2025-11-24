import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { RealEstateAgency } from '../../whatsapp/entities/real-estate-agency.entity';
import { Conversation } from '../../whatsapp/entities/conversation.entity';
import { Message } from '../../whatsapp/entities/message.entity';
import { ConversationContext } from '../interfaces/agent.interface';

@Injectable()
export class DatabaseTool {
  private readonly logger = new Logger(DatabaseTool.name);

  constructor(
    @InjectModel(RealEstateAgency)
    private realEstateAgencyModel: typeof RealEstateAgency,
    @InjectModel(Conversation)
    private conversationModel: typeof Conversation,
    @InjectModel(Message)
    private messageModel: typeof Message,
  ) {}

  async findOrCreateConversation(
    agencyId: number,
    whatsappNumber: string,
    agentName?: string
  ): Promise<Conversation> {
    try {
      // Try to find existing active conversation
      let conversation = await this.conversationModel.findOne({
        where: {
          real_estate_agency_id: agencyId,
          whatsapp_number: whatsappNumber,
          status: 'active',
        },
        include: [
          {
            model: this.realEstateAgencyModel,
            as: 'real_estate_agency',
          },
        ],
      });

      if (!conversation) {
        // Create new conversation
        conversation = await this.conversationModel.create({
          real_estate_agency_id: agencyId,
          whatsapp_number: whatsappNumber,
          agent_name: agentName,
          status: 'active',
          metadata: {
            created_by: 'agentic_orchestrator',
            created_at: new Date(),
          },
        });

        this.logger.log(`Created new conversation (ID: ${conversation.id}) for agency ${agencyId}`);
      }

      return conversation;
    } catch (error) {
      this.logger.error(`Error finding/creating conversation for agency ${agencyId}:`, error);
      throw error;
    }
  }

  async getConversationContext(conversationId: number, limit = 50): Promise<ConversationContext | null> {
    try {
      const conversation = await this.conversationModel.findByPk(conversationId, {
        include: [
          {
            model: this.realEstateAgencyModel,
            as: 'real_estate_agency',
          },
          {
            model: this.messageModel,
            as: 'messages',
            limit,
            order: [['timestamp', 'DESC']],
          },
        ],
      });

      if (!conversation) {
        return null;
      }

      const messageHistory = conversation.messages
        .reverse() // Reverse to get chronological order
        .map(message => ({
          content: message.text_content || '[Media message]',
          direction: message.direction,
          timestamp: message.timestamp,
          messageType: message.message_type,
        }));

      return {
        agencyId: conversation.real_estate_agency_id,
        conversationId: conversation.id,
        messageHistory,
        agentName: conversation.agent_name,
        lastInteraction: messageHistory[messageHistory.length - 1]?.timestamp || conversation.updated_at,
      };
    } catch (error) {
      this.logger.error(`Error getting conversation context for ID ${conversationId}:`, error);
      return null;
    }
  }

  async saveMessage(
    conversationId: number,
    whatsappMessageId: string,
    direction: 'incoming' | 'outgoing',
    messageType: string,
    textContent?: string,
    mediaData?: any
  ): Promise<Message> {
    try {
      const message = await this.messageModel.create({
        conversation_id: conversationId,
        whatsapp_message_id: whatsappMessageId,
        direction,
        message_type: messageType,
        text_content: textContent,
        timestamp: new Date(),
        is_sent: direction === 'outgoing',
        is_delivered: false,
        is_read: false,
        // Media data
        media_id: mediaData?.mediaId,
        media_url: mediaData?.mediaUrl,
        media_filename: mediaData?.filename,
        media_mime_type: mediaData?.mimeType,
        media_size: mediaData?.size,
        metadata: {
          created_by: 'agentic_orchestrator',
          ...mediaData?.metadata,
        },
      });

      this.logger.log(`Saved message (ID: ${message.id}) for conversation ${conversationId}`);
      return message;
    } catch (error) {
      this.logger.error(`Error saving message for conversation ${conversationId}:`, error);
      throw error;
    }
  }

  async updateConversationMetadata(conversationId: number, metadata: any): Promise<void> {
    try {
      await this.conversationModel.update(
        {
          metadata: {
            ...metadata,
            updated_by: 'agentic_orchestrator',
            updated_at: new Date(),
          },
        },
        {
          where: { id: conversationId },
        }
      );
    } catch (error) {
      this.logger.error(`Error updating conversation metadata for ID ${conversationId}:`, error);
      throw error;
    }
  }

  async getAgencyByPhone(phoneNumber: string): Promise<RealEstateAgency | null> {
    try {
      return await this.realEstateAgencyModel.findOne({
        where: { phone_number: phoneNumber },
      });
    } catch (error) {
      this.logger.error(`Error getting agency by phone ${phoneNumber}:`, error);
      return null;
    }
  }
}
