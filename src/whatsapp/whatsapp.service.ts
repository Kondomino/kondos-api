import { Injectable, Logger, ForbiddenException } from '@nestjs/common';
import { WebhookDto } from './dto/webhook.dto';
import { SendMessageDto } from './dto/send-message.dto';
import { ConversationService } from './services/conversation.service';
import { AgenticService } from '../agentic/agentic.service';

@Injectable()
export class WhatsappService {
  private readonly logger = new Logger(WhatsappService.name);
  private readonly verifyToken = process.env.WHATSAPP_VERIFY_TOKEN || 'your_verify_token_here';

  constructor(
    private readonly conversationService: ConversationService,
    private readonly agenticService: AgenticService,
  ) {
    this.logger.log(`WhatsApp Service initialized with verify token: ${this.verifyToken}`);
    this.logger.log(`Environment variable WHATSAPP_VERIFY_TOKEN: ${process.env.WHATSAPP_VERIFY_TOKEN}`);
    this.logger.log(`Environment variable WHATSAPP_PHONE_NUMBER_ID: ${process.env.WHATSAPP_PHONE_NUMBER_ID}`);
    this.logger.log(`Environment variable WHATSAPP_ACCESS_TOKEN: ${process.env.WHATSAPP_ACCESS_TOKEN ? 'SET' : 'NOT SET'}`);
    
    // Validate token on startup
    this.validateAndRefreshToken();
  }

  private async validateAccessToken(): Promise<boolean> {
    const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
    
    if (!accessToken) {
      this.logger.error('No access token found');
      return false;
    }
    
    try {
      const response = await fetch(`https://graph.facebook.com/v22.0/me?access_token=${accessToken}`);
      const data = await response.json();
      
      if (response.ok) {
        this.logger.log('Access token is valid');
        return true;
      } else {
        this.logger.error(`Token validation failed: ${JSON.stringify(data)}`);
        return false;
      }
    } catch (error) {
      this.logger.error('Error validating access token:', error);
      return false;
    }
  }

  private async refreshAccessToken(): Promise<string | null> {
    const clientId = process.env.WHATSAPP_CLIENT_ID;
    const clientSecret = process.env.WHATSAPP_CLIENT_SECRET;
    const currentToken = process.env.WHATSAPP_ACCESS_TOKEN;
    
    if (!clientId || !clientSecret || !currentToken) {
      this.logger.error('Missing required environment variables for token refresh');
      return null;
    }
    
    try {
      const url = `https://graph.facebook.com/v22.0/oauth/access_token?grant_type=fb_exchange_token&client_id=${clientId}&client_secret=${clientSecret}&fb_exchange_token=${currentToken}`;
      
      this.logger.log('Attempting to refresh access token...');
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      const data = await response.json();
      
      if (response.ok && data.access_token) {
        this.logger.log('Access token refreshed successfully');
        // Note: In a real application, you'd want to store this securely
        // For now, we'll just log it and the user needs to update the env var
        this.logger.log(`New access token: ${data.access_token}`);
        this.logger.log(`Token expires in: ${data.expires_in} seconds`);
        return data.access_token;
      } else {
        this.logger.error(`Token refresh failed: ${JSON.stringify(data)}`);
        return null;
      }
    } catch (error) {
      this.logger.error('Error refreshing access token:', error);
      return null;
    }
  }

  public async validateAndRefreshToken(): Promise<any> {
    const isValid = await this.validateAccessToken();
    
    if (!isValid) {
      this.logger.warn('Access token is invalid or expired, attempting to refresh...');
      const newToken = await this.refreshAccessToken();
      
      if (newToken) {
        this.logger.log('Token refreshed successfully. Please update your environment variable.');
        return {
          success: true,
          message: 'Token refreshed successfully',
          newToken: newToken,
          note: 'Please update your WHATSAPP_ACCESS_TOKEN environment variable'
        };
      } else {
        this.logger.error('Failed to refresh token. Please manually update your WHATSAPP_ACCESS_TOKEN.');
        return {
          success: false,
          message: 'Failed to refresh token',
          note: 'Please manually update your WHATSAPP_ACCESS_TOKEN environment variable'
        };
      }
    }
    
    return {
      success: true,
      message: 'Token is valid',
      note: 'No refresh needed'
    };
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
                await this.processMessage(message);
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

  private async processMessage(message: any): Promise<void> {
    this.logger.log(`Processing message: ${JSON.stringify(message, null, 2)}`);

    const from: string = message.from;
    const messageType: string = message.type;
    const textContent: string | undefined = messageType === 'text' ? message.text?.body : undefined;
    const messageId: string = message.id;

    // Extract media data if present
    let mediaData = undefined;
    if (messageType === 'image' || messageType === 'document' || messageType === 'video') {
      mediaData = {
        mediaId: message[messageType]?.id,
        mediaUrl: message[messageType]?.link,
        filename: message[messageType]?.filename,
        mimeType: message[messageType]?.mime_type,
        size: message[messageType]?.size,
      };
    }

    // Process message through Agentic service
    const agentResponse = await this.agenticService.processIncomingMessage(
      from,
      textContent || '[Media message]',
      messageType,
      messageId,
      mediaData
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
    
    const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
    let accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
    
    if (!phoneNumberId || !accessToken) {
      this.logger.error('Missing WhatsApp configuration: PHONE_NUMBER_ID or ACCESS_TOKEN');
      throw new Error('WhatsApp configuration missing');
    }
    
    // Validate token before sending
    const isTokenValid = await this.validateAccessToken();
    if (!isTokenValid) {
      this.logger.warn('Access token is invalid, attempting to refresh...');
      const newToken = await this.refreshAccessToken();
      if (newToken) {
        accessToken = newToken;
        this.logger.log('Using refreshed token for this request');
      } else {
        throw new Error('Failed to refresh access token');
      }
    }
    
    const url = `https://graph.facebook.com/v20.0/${phoneNumberId}/messages`;
    
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
          'Authorization': `Bearer ${accessToken}`,
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