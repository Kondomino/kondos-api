import { Test, TestingModule } from '@nestjs/testing';
import { WhatsappController } from './whatsapp.controller';
import { WhatsappService } from './whatsapp.service';

describe('WhatsappController', () => {
  let controller: WhatsappController;
  let service: WhatsappService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [WhatsappController],
      providers: [WhatsappService],
    }).compile();

    controller = module.get<WhatsappController>(WhatsappController);
    service = module.get<WhatsappService>(WhatsappService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('verifyWebhook', () => {
    it('should verify webhook successfully', () => {
      const mode = 'subscribe';
      const verifyToken = 'your_verify_token_here';
      const challenge = 'test_challenge';

      jest.spyOn(service, 'verifyWebhook').mockReturnValue(challenge);

      const result = controller.verifyWebhook(mode, verifyToken, challenge);
      expect(result).toBe(challenge);
    });
  });

  describe('handleWebhook', () => {
    it('should handle webhook successfully', async () => {
      const webhookData = {
        object: 'whatsapp_business_account',
        entry: []
      };

      jest.spyOn(service, 'handleWebhook').mockResolvedValue('OK');

      const result = await controller.handleWebhook(webhookData);
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

      const expectedResponse = {
        success: true,
        message: 'Message sent successfully',
        data: {
          to: messageData.to,
          type: messageData.type,
          timestamp: expect.any(String)
        }
      };

      jest.spyOn(service, 'sendMessage').mockResolvedValue(expectedResponse);

      const result = await controller.sendMessage(messageData);
      expect(result).toEqual(expectedResponse);
    });
  });
});
