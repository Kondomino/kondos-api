import { Injectable, Logger, ForbiddenException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { WebhookDto } from './dto/webhook.dto';
import { SendMessageDto } from './dto/send-message.dto';
import { ConversationService } from './services/conversation.service';
import { AgenticService } from '../agentic/agentic.service';
import { WhatsAppMediaService } from './services/whatsapp-media.service';

@Injectable()
export class WhatsappService {
  private readonly logger = new Logger(WhatsappService.name);
  private readonly verifyToken: string;
  private readonly accessToken: string;
  private readonly phoneNumberId: string;

  constructor(
    private readonly conversationService: ConversationService,
    private readonly agenticService: AgenticService,
    private readonly configService: ConfigService,
    private readonly whatsappMediaService: WhatsAppMediaService,
  ) {
    this.verifyToken = this.configService.get<string>('WHATSAPP_VERIFY_TOKEN') || 'your_verify_token_here';
    this.accessToken = this.configService.get<string>('WHATSAPP_ACCESS_TOKEN');
    this.phoneNumberId = this.configService.get<string>('WHATSAPP_PHONE_NUMBER_ID');

    this.logger.log(`WhatsApp Service initialized with verify token: ${this.verifyToken}`);
    this.logger.log(`Environment variable WHATSAPP_VERIFY_TOKEN: ${this.verifyToken}`);
    this.logger.log(`Environment variable WHATSAPP_PHONE_NUMBER_ID: ${this.phoneNumberId}`);
    this.logger.log(`Environment variable WHATSAPP_ACCESS_TOKEN: ${this.accessToken ? 'SET' : 'NOT SET'}`);
    
    if (!this.accessToken) {
      this.logger.error('WHATSAPP_ACCESS_TOKEN is not configured');
      throw new Error('WHATSAPP_ACCESS_TOKEN is required');
    }
    
    if (!this.phoneNumberId) {
      this.logger.error('WHATSAPP_PHONE_NUMBER_ID is not configured');
      throw new Error('WHATSAPP_PHONE_NUMBER_ID is required');
    }
    
    this.logger.log('WhatsApp Service initialized with System User token (no refresh needed)');
  }

  async healthCheck(): Promise<{ success: boolean; message: string; phoneNumberId?: string }> {
    try {
      const response = await fetch(`https://graph.facebook.com/v20.0/${this.phoneNumberId}?access_token=${this.accessToken}`);
      const data = await response.json();
      
      if (response.ok) {
        this.logger.log('WhatsApp API health check passed');
        return {
          success: true,
          message: 'WhatsApp API connection is healthy',
          phoneNumberId: this.phoneNumberId
        };
      } else {
        this.logger.error(`WhatsApp API health check failed: ${JSON.stringify(data)}`);
        return {
          success: false,
          message: `Health check failed: ${data.error?.message || 'Unknown error'}`
        };
      }
    } catch (error) {
      this.logger.error('Error during WhatsApp API health check:', error);
      return {
        success: false,
        message: `Health check error: ${error.message}`
      };
    }
  }

  verifyWebhook(mode: string, verifyToken: string, challenge: string): string {
    this.logger.log(`Verifying webhook: mode=${mode}, token=${verifyToken}, challenge=${challenge}`);
    this.logger.log(`Expected verify token: ${this.verifyToken}`);
    this.logger.log(`Tokens match: ${verifyToken === this.verifyToken}`);
    
    if (mode === 'subscribe' && verifyToken === this.verifyToken) {
      this.logger.log('Webhook verified successfully');
      return challenge;
    }
    
    this.logger.error('Webhook verification failed');
    this.logger.error(`Mode check: ${mode === 'subscribe'}`);
    this.logger.error(`Token check: ${verifyToken === this.verifyToken}`);
    throw new ForbiddenException('Verification failed');
  }

  async handleWebhook(webhookData: WebhookDto): Promise<string> {
    this.logger.log('Received webhook data:', JSON.stringify(webhookData, null, 2));
    
    try {
      // Handle different types of webhook events
      if (webhookData.object === 'whatsapp_business_account') {
        for (const entry of webhookData.entry || []) {
          for (const change of entry.changes || []) {
            if (change.value && change.value.messages) {
              for (const message of change.value.messages) {
                // Find the corresponding contact info for this message
                const contactInfo = change.value.contacts?.find(
                  contact => contact.wa_id === message.from
                );
                await this.processMessage(message, contactInfo);
              }
            }
          }
        }
      }
      
      return 'OK';
    } catch (error) {
      this.logger.error('Error processing webhook:', error);
      throw error;
    }
  }

  private async processMessage(message: any, contactInfo?: any): Promise<void> {
    this.logger.log(`Processing message: ${JSON.stringify(message, null, 2)}`);
    
    if (contactInfo) {
      this.logger.log(`Contact info: ${JSON.stringify(contactInfo, null, 2)}`);
    }

    const from: string = message.from;
    const messageType: string = message.type;
    const textContent: string | undefined = messageType === 'text' ? message.text?.body : undefined;
    const messageId: string = message.id;

    // Extract business profile information if available
    const businessProfile = contactInfo?.profile?.business;
    const contactName = contactInfo?.profile?.name;
    const isBusinessAccount = !!businessProfile;

    // Extract media data if present
    let mediaData = undefined;
    if (messageType === 'image' || messageType === 'document' || messageType === 'video' || messageType === 'audio') {
      const mediaInfo = message[messageType];
      if (mediaInfo?.id) {
        try {
          // Get media URL from WhatsApp API using media ID
          this.logger.log(`Getting media URL for ${messageType} with ID: ${mediaInfo.id}`);
          const whatsappMediaInfo = await this.whatsappMediaService.getMediaInfo(mediaInfo.id);
          
          mediaData = {
            mediaId: mediaInfo.id,
            mediaUrl: whatsappMediaInfo.url,
            filename: mediaInfo.filename || `media_${messageId}`,
            mimeType: whatsappMediaInfo.mimeType,
            size: whatsappMediaInfo.fileSize,
            sha256: whatsappMediaInfo.sha256,
          };
          
          this.logger.log(`Media URL resolved: ${whatsappMediaInfo.url.substring(0, 100)}...`);
        } catch (error) {
          this.logger.error(`Failed to get media URL for ${messageType} ${mediaInfo.id}: ${error.message}`);
          // Fallback: create mediaData without URL (will be handled gracefully downstream)
          mediaData = {
            mediaId: mediaInfo.id,
            filename: mediaInfo.filename || `media_${messageId}`,
            mimeType: mediaInfo.mime_type,
            size: mediaInfo.file_size,
            sha256: mediaInfo.sha256,
          };
        }
      }
    }

    // Process message through Agentic service with business profile context
    const agentResponse = await this.agenticService.processIncomingMessage(
      from,
      textContent || '[Media message]',
      messageType,
      messageId,
      mediaData,
      {
        contactName,
        isBusinessAccount,
        businessProfile
      }
    );

    // If agent decides to respond, send the message
    if (agentResponse.shouldRespond && agentResponse.message) {
      const messageData: SendMessageDto = {
        to: from,
        type: agentResponse.messageType || 'text',
        text: agentResponse.message,
      };

      const sentMessage = await this.sendMessage(messageData);

      // Post-process the interaction
      await this.postProcessMessage({
        originalMessage: message,
        agentResponse,
        sentMessage,
      });
    }
  }

  private async postProcessMessage(input: {
    originalMessage: any;
    agentResponse: any;
    sentMessage?: any;
  }): Promise<void> {
    const { originalMessage, agentResponse, sentMessage } = input;

    if (!agentResponse.conversationId) {
      return; // No persistence needed
    }

    const from = originalMessage.from;
    const messageId = originalMessage.id;
    const messageType = originalMessage.type;
    const timestamp = new Date(parseInt(originalMessage.timestamp) * 1000);

    // Persist outgoing message if present
    const outgoingMessageId: string | undefined = sentMessage?.data?.whatsappResponse?.messages?.[0]?.id;
    if (outgoingMessageId && agentResponse.message) {
      await this.conversationService.saveOutgoingMessage(
        agentResponse.conversationId,
        outgoingMessageId,
        agentResponse.messageType || 'text',
        { text: { body: agentResponse.message } },
        new Date()
      );
    }
  }

  async sendMessage(messageData: SendMessageDto): Promise<any> {
    this.logger.log(`Sending message: ${JSON.stringify(messageData, null, 2)}`);
    
    const url = `https://graph.facebook.com/v20.0/${this.phoneNumberId}/messages`;
    
    // Build payload based on message type
    let payload: any = {
      messaging_product: "whatsapp",
      to: messageData.to,
      type: messageData.type
    };
    
    if (messageData.type === 'text' && messageData.text) {
      payload.text = { body: messageData.text };
    } else if (messageData.type === 'image' && messageData.mediaUrl) {
      payload.image = { link: messageData.mediaUrl };
    } else if (messageData.type === 'document' && messageData.mediaUrl) {
      payload.document = { link: messageData.mediaUrl };
    }
    
    this.logger.log(`WhatsApp API payload: ${JSON.stringify(payload, null, 2)}`);
    
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });
      
      const responseData = await response.json();
      
      if (!response.ok) {
        this.logger.error(`WhatsApp API error: ${response.status} - ${JSON.stringify(responseData)}`);
        
        // Handle token-related errors specifically
        if (response.status === 401) {
          const errorData = responseData.error;
          if (errorData?.code === 190) {
            this.logger.error('Access token expired or invalid');
            throw new Error('Access token expired. Please refresh your token.');
          }
        }
        
        throw new Error(`WhatsApp API error: ${response.status} - ${responseData.error?.message || 'Unknown error'}`);
      }
      
      this.logger.log(`WhatsApp API response: ${JSON.stringify(responseData, null, 2)}`);
      
      return {
        success: true,
        message: 'Message sent successfully',
        data: {
          to: messageData.to,
          type: messageData.type,
          timestamp: new Date().toISOString(),
          whatsappResponse: responseData
        }
      };
    } catch (error) {
      this.logger.error('Error sending message via WhatsApp API:', error);
      throw error;
    }
  }
}