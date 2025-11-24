import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { RealEstateAgency } from '../entities/real-estate-agency.entity';
import { Conversation } from '../entities/conversation.entity';
import { Message } from '../entities/message.entity';

@Injectable()
export class ConversationService {
  private readonly logger = new Logger(ConversationService.name);

  constructor(
    @InjectModel(RealEstateAgency)
    private readonly realEstateAgencyModel: typeof RealEstateAgency,
    @InjectModel(Conversation)
    private readonly conversationModel: typeof Conversation,
    @InjectModel(Message)
    private readonly messageModel: typeof Message,
  ) {}

  /**
   * Placeholder method to detect if a user is a real estate agent
   * This will be replaced with actual AI logic in the next step
   */
  public async isRealEstateAgent(phoneNumber: string, messageContent?: string): Promise<boolean> {
    this.logger.log(`Checking if ${phoneNumber} is a real estate agent`);
    
    // For now, we'll use a simple heuristic based on message content
    // In the next step, this will be replaced with proper AI analysis
    
    if (messageContent) {
      const content = messageContent.toLowerCase();
      const realEstateKeywords = [
        'apartamento', 'casa', 'imóvel', 'venda', 'aluguel', 'corretor', 'imobiliária',
        'apartment', 'house', 'property', 'sale', 'rent', 'realtor', 'real estate',
        'condomínio', 'condominium', 'lote', 'terreno', 'lot', 'land'
      ];
      
      const hasRealEstateKeywords = realEstateKeywords.some(keyword => 
        content.includes(keyword)
      );
      
      if (hasRealEstateKeywords) {
        this.logger.log(`User ${phoneNumber} identified as real estate agent based on keywords`);
        return true;
      }
    }
    
    // Check if phone number is already associated with a real estate agency
    const existingAgency = await this.realEstateAgencyModel.findOne({
      where: { phone_number: phoneNumber }
    });
    
    if (existingAgency) {
      this.logger.log(`User ${phoneNumber} is already registered as real estate agent`);
      return true;
    }
    
    this.logger.log(`User ${phoneNumber} is not identified as real estate agent`);
    return false;
  }

  /**
   * Get or create a real estate agency
   */
  public async getOrCreateAgency(phoneNumber: string, agentName?: string): Promise<RealEstateAgency> {
    let agency = await this.realEstateAgencyModel.findOne({
      where: { phone_number: phoneNumber }
    });

    if (!agency) {
      this.logger.log(`Creating new real estate agency for ${phoneNumber}`);
      agency = await this.realEstateAgencyModel.create({
        name: agentName || `Agency ${phoneNumber}`,
        phone_number: phoneNumber,
        is_active: true,
        metadata: {
          created_from_whatsapp: true,
          first_contact: new Date()
        }
      });
    }

    return agency;
  }

  /**
   * Get or create a conversation
   */
  public async getOrCreateConversation(
    agencyId: number, 
    phoneNumber: string, 
    agentName?: string
  ): Promise<Conversation> {
    let conversation = await this.conversationModel.findOne({
      where: {
        real_estate_agency_id: agencyId,
        whatsapp_number: phoneNumber,
        status: 'active'
      }
    });

    if (!conversation) {
      this.logger.log(`Creating new conversation for agency ${agencyId} and phone ${phoneNumber}`);
      conversation = await this.conversationModel.create({
        real_estate_agency_id: agencyId,
        whatsapp_number: phoneNumber,
        agent_name: agentName,
        status: 'active',
        metadata: {
          created_from_whatsapp: true,
          first_message: new Date()
        }
      });
    }

    return conversation;
  }

  /**
   * Save an incoming message to the database
   */
  public async saveIncomingMessage(
    conversationId: number,
    whatsappMessageId: string,
    messageType: string,
    content: any,
    timestamp: Date
  ): Promise<Message> {
    this.logger.log(`Saving incoming message ${whatsappMessageId} to conversation ${conversationId}`);

    const messageData: any = {
      conversation_id: conversationId,
      whatsapp_message_id: whatsappMessageId,
      direction: 'incoming',
      message_type: messageType,
      timestamp: timestamp,
      is_read: true,
      is_delivered: true,
      is_sent: true,
      metadata: content
    };

    // Handle different message types
    if (messageType === 'text' && content.text?.body) {
      messageData.text_content = content.text.body;
    } else if (['image', 'document', 'audio', 'video'].includes(messageType)) {
      const mediaData = content[messageType];
      messageData.media_id = mediaData.id;
      messageData.media_filename = mediaData.filename;
      messageData.media_mime_type = mediaData.mime_type;
      messageData.media_size = mediaData.file_size;
      messageData.media_sha256 = mediaData.sha256;
    } else if (messageType === 'location') {
      const locationData = content.location;
      messageData.latitude = locationData.latitude;
      messageData.longitude = locationData.longitude;
      messageData.location_name = locationData.name;
      messageData.location_address = locationData.address;
    } else if (messageType === 'contact') {
      const contactData = content.contacts?.[0];
      if (contactData) {
        messageData.contact_name = contactData.name?.formatted_name;
        messageData.contact_phone = contactData.phones?.[0]?.wa_id;
        messageData.contact_email = contactData.emails?.[0]?.email;
      }
    }

    return await this.messageModel.create(messageData);
  }

  /**
   * Save an outgoing message to the database
   */
  public async saveOutgoingMessage(
    conversationId: number,
    whatsappMessageId: string,
    messageType: string,
    content: any,
    timestamp: Date
  ): Promise<Message> {
    this.logger.log(`Saving outgoing message ${whatsappMessageId} to conversation ${conversationId}`);

    const messageData: any = {
      conversation_id: conversationId,
      whatsapp_message_id: whatsappMessageId,
      direction: 'outgoing',
      message_type: messageType,
      timestamp: timestamp,
      is_sent: true,
      metadata: content
    };

    // Handle different message types
    if (messageType === 'text' && content.text?.body) {
      messageData.text_content = content.text.body;
    } else if (['image', 'document', 'audio', 'video'].includes(messageType)) {
      const mediaData = content[messageType];
      messageData.media_id = mediaData.id;
      messageData.media_url = mediaData.link; // Cloud storage URL
      messageData.media_filename = mediaData.filename;
      messageData.media_mime_type = mediaData.mime_type;
    }

    return await this.messageModel.create(messageData);
  }

  /**
   * Get conversation history
   */
  public async getConversationHistory(conversationId: number, limit = 50): Promise<Message[]> {
    return await this.messageModel.findAll({
      where: { conversation_id: conversationId },
      order: [['timestamp', 'ASC']],
      limit,
      include: [{
        model: Conversation,
        include: [RealEstateAgency]
      }]
    });
  }

  /**
   * Update message status (delivered, read, etc.)
   */
  public async updateMessageStatus(
    whatsappMessageId: string,
    status: 'delivered' | 'read' | 'sent'
  ): Promise<void> {
    const updateData: any = {};
    
    if (status === 'delivered') updateData.is_delivered = true;
    if (status === 'read') updateData.is_read = true;
    if (status === 'sent') updateData.is_sent = true;

    await this.messageModel.update(updateData, {
      where: { whatsapp_message_id: whatsappMessageId }
    });
  }
}
