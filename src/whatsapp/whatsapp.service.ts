import { Injectable, Logger, ForbiddenException } from '@nestjs/common';
import { WebhookDto } from './dto/webhook.dto';
import { SendMessageDto } from './dto/send-message.dto';
import { AIAgentMock, AIResponse } from './ai.agent.mock';
import { ConversationService } from './services/conversation.service';

@Injectable()
export class WhatsappService {
  private readonly logger = new Logger(WhatsappService.name);
  private readonly verifyToken = process.env.WHATSAPP_VERIFY_TOKEN || 'your_verify_token_here';
  private readonly aiAgent = new AIAgentMock();

  constructor(
    private readonly conversationService: ConversationService
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

    // Single place to detect whether the sender is a real estate agent
    const isRealEstateAgent: boolean = await this.conversationService.isRealEstateAgent(from, textContent);

    if (!isRealEstateAgent) {
      this.logger.log(`Message from ${from}. Not a real estate agent`);
      return;
    }

    let sendResult: { type: 'text' | 'image' | 'document'; aiResponse?: AIResponse; whatsappResponse?: any } | undefined;

    if (messageType === 'text') {
      sendResult = await this.handleTextMessage(message);
    } else if (messageType === 'image') {
      sendResult = await this.handleImageMessage(message);
    } else {
      this.logger.log(`Unhandled message type: ${messageType}`);
    }

    await this.postProcessMessage({
      isRealEstateAgent,
      originalMessage: message,
      sent: sendResult,
    });
  }

  private async handleTextMessage(message: any): Promise<{ type: 'text'; aiResponse: AIResponse; whatsappResponse: any }> {
    const text = message.text?.body;
    const from = message.from;
    
    this.logger.log(`Received text message from ${from}: ${text}`);
    
    const aiResponse = this.aiAgent.getResponse(text);
    this.logger.log(`AI Response: ${JSON.stringify(aiResponse, null, 2)}`);

    const sentMessage = await this.sendAIResponse(from, aiResponse);
    const whatsappResponse = sentMessage?.data?.whatsappResponse;

    return { type: 'text', aiResponse, whatsappResponse };
  }

  private async handleImageMessage(message: any): Promise<{ type: 'image'; aiResponse: AIResponse; whatsappResponse: any }> {
    const from = message.from;
    
    this.logger.log(`Received image message from ${from}: ${message.image?.id}`);

    const aiResponse: AIResponse = {
      message: "📸 Obrigado pela imagem! Vou analisar e te respondo em breve.",
      type: 'text'
    };

    const sentMessage = await this.sendAIResponse(from, aiResponse);
    const whatsappResponse = sentMessage?.data?.whatsappResponse;

    return { type: 'image', aiResponse, whatsappResponse };
  }

  private async postProcessMessage(input: {
    isRealEstateAgent: boolean;
    originalMessage: any;
    sent?: { type: 'text' | 'image' | 'document'; aiResponse?: AIResponse; whatsappResponse?: any };
  }): Promise<void> {
    const { isRealEstateAgent, originalMessage, sent } = input;

    if (!isRealEstateAgent) {
      return; // Non-agents: no persistence
    }

    const from = originalMessage.from;
    const messageId = originalMessage.id;
    const messageType = originalMessage.type;
    const timestamp = new Date(parseInt(originalMessage.timestamp) * 1000);

    // Ensure agency and conversation exist
    const agency = await this.conversationService.getOrCreateAgency(from);
    const conversation = await this.conversationService.getOrCreateConversation(agency.id, from);

    // Persist incoming
    await this.conversationService.saveIncomingMessage(
      conversation.id,
      messageId,
      messageType,
      originalMessage,
      timestamp
    );

    // Persist outgoing if present
    const outgoingMessageId: string | undefined = sent?.whatsappResponse?.messages?.[0]?.id;
    if (outgoingMessageId && sent) {
      let content: any = {};
      if (sent.type === 'text' && sent.aiResponse?.message) {
        content = { text: { body: sent.aiResponse.message } };
      } else if (sent.type === 'image' && originalMessage.image?.id) {
        content = { image: { id: originalMessage.image.id } };
      }

      await this.conversationService.saveOutgoingMessage(
        conversation.id,
        outgoingMessageId,
        sent.type,
        content,
        new Date()
      );
    }
  }

  async sendAIResponse(to: string, aiResponse: AIResponse): Promise<any> {
    this.logger.log(`Sending AI response to ${to}: ${aiResponse.message}`);
    
    const messageData: SendMessageDto = {
      to: to,
      type: aiResponse.type,
      text: aiResponse.message,
      mediaUrl: aiResponse.mediaUrl
    };
    
    this.logger.log(`Sending message data: ${JSON.stringify(messageData, null, 2)}`);
    
    // Actually send the message via WhatsApp API
    return await this.sendMessage(messageData);
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
