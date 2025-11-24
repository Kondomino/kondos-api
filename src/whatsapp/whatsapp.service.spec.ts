import { Test, TestingModule } from '@nestjs/testing';
import { WhatsappService } from './whatsapp.service';
import { ForbiddenException } from '@nestjs/common';

describe('WhatsappService', () => {
  let service: WhatsappService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [WhatsappService],
    }).compile();

    service = module.get<WhatsappService>(WhatsappService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('verifyWebhook', () => {
    it('should verify webhook successfully with correct token', () => {
      const mode = 'subscribe';
      const verifyToken = 'your_verify_token_here';
      const challenge = 'test_challenge';

      const result = service.verifyWebhook(mode, verifyToken, challenge);
      expect(result).toBe(challenge);
    });

    it('should throw ForbiddenException with incorrect token', () => {
      const mode = 'subscribe';
      const verifyToken = 'wrong_token';
      const challenge = 'test_challenge';

      expect(() => {
        service.verifyWebhook(mode, verifyToken, challenge);
      }).toThrow(ForbiddenException);
    });

    it('should throw ForbiddenException with wrong mode', () => {
      const mode = 'unsubscribe';
      const verifyToken = 'your_verify_token_here';
      const challenge = 'test_challenge';

      expect(() => {
        service.verifyWebhook(mode, verifyToken, challenge);
      }).toThrow(ForbiddenException);
    });
  });

  describe('handleWebhook', () => {
    it('should handle webhook successfully', async () => {
      const webhookData = {
        object: 'whatsapp_business_account',
        entry: []
      };

      const result = await service.handleWebhook(webhookData);
      expect(result).toBe('OK');
    });

    it('should handle webhook with messages', async () => {
      const webhookData = {
        object: 'whatsapp_business_account',
        entry: [
          {
            id: 'test_entry_id',
            changes: [
              {
                value: {
                  messaging_product: 'whatsapp',
                  metadata: {
                    display_phone_number: '+1234567890',
                    phone_number_id: 'test_phone_id'
                  },
                  messages: [
                    {
                      id: 'test_message_id',
                      type: 'text',
                      from: '5511999999999',
                      timestamp: '1234567890',
                      text: {
                        body: 'Hello World'
                      }
                    }
                  ]
                },
                field: 'messages'
              }
            ]
          }
        ]
      };

      const result = await service.handleWebhook(webhookData);
      expect(result).toBe('OK');
    });
  });

  describe('sendMessage', () => {
    it('should send message successfully', async () => {
      const messageData = {
        to: '5511999999999',
        type: 'text',
        text: 'Hello World'
      };

      const result = await service.sendMessage(messageData);
      expect(result.success).toBe(true);
      expect(result.message).toBe('Message sent successfully');
      expect(result.data.to).toBe(messageData.to);
      expect(result.data.type).toBe(messageData.type);
      expect(result.data.timestamp).toBeDefined();
    });
  });
});
