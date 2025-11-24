import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class GrokService {
  private readonly logger = new Logger(GrokService.name);
  private readonly apiKey: string;
  private readonly apiEndpoint: string;

  constructor(private configService: ConfigService) {
    this.apiKey = this.configService.get<string>('GROK_API_KEY');
    this.apiEndpoint = this.configService.get<string>('GROK_API_ENDPOINT');
  }

  async generateResponse(messages: any[]): Promise<string> {
    try {
      // This will be replaced with actual Grok API call when available
      const response = await this.callGrokAPI(messages);
      return response;
    } catch (error) {
      this.logger.error(`Error calling Grok API: ${error.message}`, error.stack);
      throw error;
    }
  }

  async testCredentials(): Promise<{ success: boolean; message: string; response?: any }> {
    try {
      if (!this.apiKey || !this.apiEndpoint) {
        return {
          success: false,
          message: 'Missing GROK_API_KEY or GROK_API_ENDPOINT environment variables'
        };
      }

      // Simple test message
      const testMessages = [
        { role: 'user', content: 'Hello, this is a test message. Please respond with "Test successful".' }
      ];

      const response = await fetch(this.apiEndpoint, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'grok-3-mini',
          messages: testMessages,
          max_tokens: 50,
          temperature: 0.1
        })
      });

      const data = await response.json();

      if (!response.ok) {
        this.logger.error(`Grok API test failed: ${response.status} - ${JSON.stringify(data)}`);
        return {
          success: false,
          message: `API Error ${response.status}: ${data.error?.message || 'Unknown error'}`,
          response: data
        };
      }

      this.logger.log('Grok API credentials test successful');
      return {
        success: true,
        message: 'Grok API credentials are valid',
        response: data
      };

    } catch (error) {
      this.logger.error('Error testing Grok API credentials:', error);
      return {
        success: false,
        message: `Test error: ${error.message}`
      };
    }
  }

  private async callGrokAPI(messages: any[]): Promise<string> {
    try {
      const payload = {
        messages: messages.map(msg => ({
          role: msg.type === 'system' ? 'system' : 
                msg.type === 'human' ? 'user' : 'assistant',
          content: msg.content
        })),
        model: 'grok-3-mini', // Using the working model from your test
        temperature: 0.7,
        max_tokens: 1500, // Increased for better real estate conversations
        stream: false
      };

      this.logger.log(`Calling Grok API with ${payload.messages.length} messages`);

      const response = await fetch(this.apiEndpoint, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorData = await response.json();
        this.logger.error(`Grok API error: ${response.status} - ${JSON.stringify(errorData)}`);
        throw new Error(`Grok API error: ${response.status} - ${errorData.error?.message || 'Unknown error'}`);
      }

      const data = await response.json();
      
      if (!data.choices || !data.choices[0] || !data.choices[0].message) {
        this.logger.error('Unexpected Grok API response format:', JSON.stringify(data));
        throw new Error('Invalid response format from Grok API');
      }

      const responseContent = data.choices[0].message.content;
      this.logger.log(`Grok API response received: ${responseContent.length} characters`);
      
      return responseContent;
    } catch (error) {
      this.logger.error(`Error in Grok API call: ${error.message}`, error.stack);
      throw error;
    }
  }
}
