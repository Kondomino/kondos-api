import { Test, TestingModule } from '@nestjs/testing';
import { AgentOrchestrator } from '../../orchestrator/agent.orchestrator';
import { KondoQualityAssessmentService } from '../../../kondo-quality/services/kondo-quality-assessment.service';
import { RawContentStorageService } from '../../../storage/services/raw-content-storage.service';
import { VerificationService } from '../../orchestrator/verification.service';
import { DatabaseTool } from '../../tools/database.tool';
import { IncomingMessage } from '../../interfaces/agent.interface';
import { DEFAULT_KONDO_QUALITY_CONFIG } from '../../../config/kondo-quality.config';

describe.skip('Kondo Quality Scoring Flow Integration', () => {
  let moduleRef: TestingModule;
  let orchestrator: AgentOrchestrator;
  let qualityService: jest.Mocked<KondoQualityAssessmentService>;
  let rawStorageService: jest.Mocked<RawContentStorageService>;
  let verificationService: jest.Mocked<VerificationService>;
  let databaseTool: jest.Mocked<DatabaseTool>;

  // Mock data stores
  const agencies: any[] = [];
  const conversations: any[] = [];
  const kondos: any[] = [];
  const messages: any[] = [];

  beforeAll(async () => {
    // Setup mocks
    const qualityServiceMock = {
      assessKondoDataQuality: jest.fn(),
      meetsQualityThreshold: jest.fn(),
      assessAndUpdateQuality: jest.fn(),
    };

    const rawStorageServiceMock = {
      storeRawPdfContent: jest.fn(),
      storeRawMediaContent: jest.fn(),
      createRawContentEntry: jest.fn(),
    };

    const verificationServiceMock = {
      verifyAgent: jest.fn(),
      createAgencyFromVerification: jest.fn(),
    };

    const databaseToolMock = {
      findOrCreateConversation: jest.fn(),
      saveMessage: jest.fn(),
      getConversationContext: jest.fn(),
      updateConversationMetadata: jest.fn(),
      getAgencyByPhone: jest.fn(),
      // Stubs for methods that don't exist yet but are referenced in skipped tests
      findKondoByConversationContext: jest.fn(),
      archiveConversation: jest.fn(),
    };

    moduleRef = await Test.createTestingModule({
      providers: [
        AgentOrchestrator,
        { provide: KondoQualityAssessmentService, useValue: qualityServiceMock },
        { provide: RawContentStorageService, useValue: rawStorageServiceMock },
        { provide: VerificationService, useValue: verificationServiceMock },
        { provide: DatabaseTool, useValue: databaseToolMock },
        { provide: 'KONDO_QUALITY_CONFIG', useValue: DEFAULT_KONDO_QUALITY_CONFIG },
      ],
    }).compile();

    orchestrator = moduleRef.get(AgentOrchestrator);
    qualityService = moduleRef.get(KondoQualityAssessmentService);
    rawStorageService = moduleRef.get(RawContentStorageService);
    verificationService = moduleRef.get(VerificationService);
    databaseTool = moduleRef.get(DatabaseTool);

    // Setup initial data
    setupMockData();
  });

  afterAll(async () => {
    await moduleRef.close();
  });

  beforeEach(() => {
    jest.clearAllMocks();
    setupDefaultMockBehaviors();
  });

  describe('PDF Processing with Quality Assessment', () => {
    it('should process PDF and continue conversation when Kondo quality is below threshold', async () => {
      // Setup: Low quality Kondo (0.4 overall score < 0.7 threshold)
      const lowQualityKondo = {
        id: 1,
        name: 'Test Kondo',
        kondo_data_content_quality: 0.3,
        kondo_data_media_quality: 0.5,
      };

      kondos.push(lowQualityKondo);

      databaseTool.findKondoByConversationContext.mockResolvedValue(lowQualityKondo);
      qualityService.assessKondoDataQuality.mockResolvedValue({
        kondoId: 1,
        contentQuality: 0.3,
        mediaQuality: 0.5,
        overallQuality: 0.4,
        meetsThreshold: false, // 0.4 < 0.7 threshold
        lastUpdated: new Date(),
        breakdown: {
          content: { basicInfo: 0.5, pricing: 0.2, conveniences: 0.3, details: 0.2 },
          media: { images: 0.6, quality: 0.4, videos: 0.3, recency: 0.7 }
        }
      });

      rawStorageService.storeRawPdfContent.mockResolvedValue({
        success: true,
        agencyId: 1,
        messageId: 'msg123',
        contentType: 'pdf',
        originalFile: {
          path: 'raw-content/agency-1/pdfs/msg123/original.pdf',
          url: 'https://spaces.example.com/raw-content/agency-1/pdfs/msg123/original.pdf',
          size: 1000000,
          contentType: 'application/pdf',
        },
        extractedContent: {
          textFile: {
            path: 'raw-content/agency-1/pdfs/msg123/extracted/text.json',
            url: 'https://spaces.example.com/text.json',
            size: 5000,
            contentType: 'application/json',
          },
          images: [
            {
              path: 'raw-content/agency-1/pdfs/msg123/extracted/images/image_0.jpg',
              url: 'https://spaces.example.com/image_0.jpg',
              size: 200000,
              contentType: 'image/jpeg',
            }
          ],
        },
        metadata: {
          processingTime: 2000,
          timestamp: new Date(),
          originalFilename: 'brochure.pdf',
        }
      });

      const incomingMessage: IncomingMessage = {
        phoneNumber: '5511999999999',
        content: 'Aqui está o material do nosso novo condomínio',
        messageType: 'document',
        timestamp: new Date(),
        whatsappMessageId: 'msg123',
        mediaData: {
          mediaId: 'media123',
          mediaUrl: 'https://whatsapp.com/media/document.pdf',
          filename: 'brochure.pdf',
          mimeType: 'application/pdf',
          size: 1000000,
        },
      };

      const response = await orchestrator.processMessage(incomingMessage);

      // Verify quality assessment was performed
      expect(databaseTool.findKondoByConversationContext).toHaveBeenCalled();
      expect(qualityService.assessKondoDataQuality).toHaveBeenCalledWith(1);

      // Verify raw content storage was called (since quality < threshold)
      expect(rawStorageService.storeRawPdfContent).toHaveBeenCalledWith(
        expect.objectContaining({
          agencyId: 1,
          messageId: 'msg123',
          originalFilename: 'brochure.pdf',
          extractedContent: expect.objectContaining({
            text: expect.any(String),
            images: expect.any(Array),
          }),
        })
      );

      // Verify conversation continues (not archived)
      expect(response.shouldRespond).toBe(true);
      expect(databaseTool.archiveConversation).not.toHaveBeenCalled();
    });

    it('should archive conversation when Kondo quality meets threshold', async () => {
      // Setup: High quality Kondo (0.8 overall score > 0.7 threshold)
      const highQualityKondo = {
        id: 2,
        name: 'Premium Kondo',
        kondo_data_content_quality: 0.9,
        kondo_data_media_quality: 0.7,
      };

      kondos.push(highQualityKondo);

      databaseTool.findKondoByConversationContext.mockResolvedValue(highQualityKondo);
      qualityService.assessKondoDataQuality.mockResolvedValue({
        kondoId: 2,
        contentQuality: 0.9,
        mediaQuality: 0.7,
        overallQuality: 0.8,
        meetsThreshold: true, // 0.8 > 0.7 threshold
        lastUpdated: new Date(),
        breakdown: {
          content: { basicInfo: 0.9, pricing: 0.9, conveniences: 0.8, details: 1.0 },
          media: { images: 0.8, quality: 0.7, videos: 0.6, recency: 0.7 }
        }
      });

      const incomingMessage: IncomingMessage = {
        phoneNumber: '5511888888888',
        content: 'Temos mais informações sobre esse empreendimento',
        messageType: 'text',
        timestamp: new Date(),
        whatsappMessageId: 'msg456',
      };

      const response = await orchestrator.processMessage(incomingMessage);

      // Verify quality assessment was performed
      expect(qualityService.assessKondoDataQuality).toHaveBeenCalledWith(2);

      // Verify conversation was archived (quality >= threshold)
      expect(databaseTool.archiveConversation).toHaveBeenCalledWith(
        expect.objectContaining({ id: expect.any(Number) })
      );

      // Verify polite disengagement response
      expect(response.shouldRespond).toBe(true);
      expect(response.message).toContain('Obrigado'); // Should contain polite message
      
      // Verify raw content storage was NOT called (conversation archived)
      expect(rawStorageService.storeRawPdfContent).not.toHaveBeenCalled();
    });
  });

  describe('Image and Video Processing', () => {
    it('should store image content in raw storage and update quality scores', async () => {
      const mediumQualityKondo = {
        id: 3,
        name: 'Medium Kondo',
        kondo_data_content_quality: 0.6,
        kondo_data_media_quality: 0.5,
      };

      databaseTool.findKondoByConversationContext.mockResolvedValue(mediumQualityKondo);
      qualityService.assessKondoDataQuality.mockResolvedValue({
        kondoId: 3,
        contentQuality: 0.6,
        mediaQuality: 0.5,
        overallQuality: 0.55,
        meetsThreshold: false, // 0.55 < 0.7 threshold
        lastUpdated: new Date(),
        breakdown: {
          content: { basicInfo: 0.7, pricing: 0.5, conveniences: 0.6, details: 0.6 },
          media: { images: 0.4, quality: 0.5, videos: 0.3, recency: 0.8 }
        }
      });

      rawStorageService.storeRawMediaContent.mockResolvedValue({
        success: true,
        agencyId: 2,
        messageId: 'msg789',
        contentType: 'image',
        originalFile: {
          path: 'raw-content/agency-2/images/msg789/original.jpg',
          url: 'https://spaces.example.com/raw-content/agency-2/images/msg789/original.jpg',
          size: 500000,
          contentType: 'image/jpeg',
        },
        metadata: {
          processingTime: 500,
          timestamp: new Date(),
          originalFilename: 'kondo-photo.jpg',
        }
      });

      const incomingMessage: IncomingMessage = {
        phoneNumber: '5511777777777',
        content: 'Foto da área de lazer do condomínio',
        messageType: 'image',
        timestamp: new Date(),
        whatsappMessageId: 'msg789',
        mediaData: {
          mediaId: 'image789',
          mediaUrl: 'https://whatsapp.com/media/image.jpg',
          filename: 'kondo-photo.jpg',
          mimeType: 'image/jpeg',
          size: 500000,
        },
      };

      const response = await orchestrator.processMessage(incomingMessage);

      // Verify image storage in raw content folder
      expect(rawStorageService.storeRawMediaContent).toHaveBeenCalledWith({
        agencyId: 2,
        messageId: 'msg789',
        mediaBuffer: expect.any(Buffer),
        mediaType: 'image',
        originalFilename: 'kondo-photo.jpg',
        contentType: 'image/jpeg',
      });

      // Verify conversation continues (quality below threshold)
      expect(response.shouldRespond).toBe(true);
    });
  });

  describe('Configuration Threshold Testing', () => {
    it('should respect different quality thresholds', async () => {
      // Test with different threshold values
      const testCases = [
        { threshold: 0.5, kondoScore: 0.6, shouldArchive: true },
        { threshold: 0.7, kondoScore: 0.6, shouldArchive: false },
        { threshold: 0.9, kondoScore: 0.8, shouldArchive: false },
      ];

      for (const testCase of testCases) {
        jest.clearAllMocks();
        
        // Mock different threshold configuration
        const customConfig = {
          ...DEFAULT_KONDO_QUALITY_CONFIG,
          threshold: testCase.threshold,
        };

        // Update the module with custom config
        const customModule = await Test.createTestingModule({
          providers: [
            AgentOrchestrator,
            { provide: KondoQualityAssessmentService, useValue: qualityService },
            { provide: RawContentStorageService, useValue: rawStorageService },
            { provide: VerificationService, useValue: verificationService },
            { provide: DatabaseTool, useValue: databaseTool },
            { provide: 'KONDO_QUALITY_CONFIG', useValue: customConfig },
          ],
        }).compile();

        const customOrchestrator = customModule.get(AgentOrchestrator);

        const testKondo = {
          id: 99,
          name: 'Test Kondo',
          kondo_data_content_quality: testCase.kondoScore,
          kondo_data_media_quality: testCase.kondoScore,
        };

        databaseTool.findKondoByConversationContext.mockResolvedValue(testKondo);
        qualityService.assessKondoDataQuality.mockResolvedValue({
          kondoId: 99,
          contentQuality: testCase.kondoScore,
          mediaQuality: testCase.kondoScore,
          overallQuality: testCase.kondoScore,
          meetsThreshold: testCase.shouldArchive,
          lastUpdated: new Date(),
          breakdown: {
            content: { basicInfo: 0.7, pricing: 0.7, conveniences: 0.7, details: 0.7 },
            media: { images: 0.7, quality: 0.7, videos: 0.7, recency: 0.7 }
          }
        });

        const message: IncomingMessage = {
          phoneNumber: '5511000000000',
          content: 'Test message',
          messageType: 'text',
          timestamp: new Date(),
          whatsappMessageId: `test-${testCase.threshold}`,
        };

        await customOrchestrator.processMessage(message);

        if (testCase.shouldArchive) {
          expect(databaseTool.archiveConversation).toHaveBeenCalled();
        } else {
          expect(databaseTool.archiveConversation).not.toHaveBeenCalled();
        }

        await customModule.close();
      }
    });
  });

  describe('Error Handling', () => {
    it('should handle quality assessment failures gracefully', async () => {
      databaseTool.findKondoByConversationContext.mockResolvedValue({ id: 1 });
      qualityService.assessKondoDataQuality.mockRejectedValue(new Error('Quality assessment failed'));

      const message: IncomingMessage = {
        phoneNumber: '5511999999999',
        content: 'Test message',
        messageType: 'text',
        timestamp: new Date(),
        whatsappMessageId: 'error-test',
      };

      const response = await orchestrator.processMessage(message);

      // Should continue processing despite quality assessment failure
      expect(response.shouldRespond).toBe(true);
      expect(databaseTool.archiveConversation).not.toHaveBeenCalled();
    });

    it('should handle raw storage failures gracefully', async () => {
      databaseTool.findKondoByConversationContext.mockResolvedValue({
        id: 1,
        kondo_data_content_quality: 0.3,
        kondo_data_media_quality: 0.3,
      });

      qualityService.assessKondoDataQuality.mockResolvedValue({
        kondoId: 1,
        contentQuality: 0.3,
        mediaQuality: 0.3,
        overallQuality: 0.3,
        meetsThreshold: false,
        lastUpdated: new Date(),
        breakdown: {
          content: { basicInfo: 0.3, pricing: 0.3, conveniences: 0.3, details: 0.3 },
          media: { images: 0.3, quality: 0.3, videos: 0.3, recency: 0.3 }
        }
      });

      rawStorageService.storeRawPdfContent.mockResolvedValue({
        success: false,
        agencyId: 1,
        messageId: 'error-msg',
        contentType: 'pdf',
        originalFile: { path: '', url: '', size: 0, contentType: 'application/pdf' },
        metadata: { processingTime: 100, timestamp: new Date(), originalFilename: 'test.pdf' },
        error: 'Storage service unavailable',
      });

      const message: IncomingMessage = {
        phoneNumber: '5511999999999',
        content: 'PDF test',
        messageType: 'document',
        timestamp: new Date(),
        whatsappMessageId: 'error-msg',
        mediaData: {
          mediaId: 'error-media',
          mediaUrl: 'https://example.com/test.pdf',
          filename: 'test.pdf',
          mimeType: 'application/pdf',
          size: 100000,
        },
      };

      const response = await orchestrator.processMessage(message);

      // Should continue processing despite storage failure
      expect(response.shouldRespond).toBe(true);
    });
  });

  // Helper functions
  function setupMockData() {
    // Setup initial agencies
    agencies.push({
      id: 1,
      name: 'Agência Teste 1',
      phone_number: '5511999999999',
    });

    agencies.push({
      id: 2,
      name: 'Agência Teste 2',
      phone_number: '5511888888888',
    });
  }

  function setupDefaultMockBehaviors() {
    // Default verification behavior
    verificationService.verifyAgent.mockImplementation(async (phoneNumber) => {
      const agency = agencies.find(a => a.phone_number === phoneNumber);
      return {
        isRealEstateAgent: true,
        confidence: 1.0,
        reasoning: 'Test agent',
        shouldAskForClarification: false,
        existingAgency: agency ? { id: agency.id, name: agency.name, phone_number: agency.phone_number } : undefined,
      };
    });

    // Default conversation creation
    databaseTool.findOrCreateConversation.mockImplementation(async (agencyId, whatsappNumber) => {
      const existing = conversations.find(c => c.real_estate_agency_id === agencyId && c.whatsapp_number === whatsappNumber);
      if (existing) return existing;

      const newConversation = {
        id: conversations.length + 1,
        real_estate_agency_id: agencyId,
        whatsapp_number: whatsappNumber,
        status: 'active',
        created_at: new Date(),
        updated_at: new Date(),
      };

      conversations.push(newConversation);
      return newConversation;
    });

    // Default message saving
    databaseTool.saveMessage.mockImplementation(async (conversationId, whatsappMessageId, direction, messageType, textContent, mediaData) => {
      const message = {
        id: messages.length + 1,
        conversation_id: conversationId,
        whatsapp_message_id: whatsappMessageId,
        direction,
        message_type: messageType,
        text_content: textContent,
        timestamp: new Date(),
        is_sent: direction === 'outgoing',
        is_delivered: false,
        is_read: false,
        media_id: mediaData?.mediaId,
        media_url: mediaData?.mediaUrl,
        media_filename: mediaData?.filename,
        media_mime_type: mediaData?.mimeType,
        media_size: mediaData?.size,
        metadata: {
          created_by: 'agentic_orchestrator',
          ...mediaData?.metadata,
        },
      } as any;

      messages.push(message);
      return message;
    });


  }
});
