import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { VerificationService } from './orchestrator/verification.service';
import { AgenticService } from './agentic.service';
import { DatabaseTool } from './tools/database.tool';
import { RealEstateAgency } from '../whatsapp/entities/real-estate-agency.entity';
import { Conversation } from '../whatsapp/entities/conversation.entity';
import { Message } from '../whatsapp/entities/message.entity';
import { MessageQueue } from './entities/message-queue.entity';
import { MessageQueueService } from './services/message-queue.service';
import { AgentOrchestrator } from './orchestrator/agent.orchestrator';
import { ChattyAgent } from './agents/chatty/chatty.agent';
import { GrokService } from './agents/chatty/grok.service';
import { ConversationTool } from './tools/conversation.tool';
import { MessagePersistenceTool, RelevanceAssessmentTool } from './tools/message-persistence.tool';
import { OutboundWhatsAppClient } from './services/outbound-whatsapp.client';
import { VerifiedMediaProcessorService } from '../whatsapp/services/verified-media-processor.service';
import { MediaProcessingService } from '../whatsapp/services/media-processing.service';
import { AdobePdfService } from '../whatsapp/services/adobe-pdf.service';
import { MediaUploadService } from '../whatsapp/services/media-upload.service';
import { DigitalOceanSpacesService } from '../whatsapp/services/digital-ocean-spaces.service';
import { Media } from '../media/entities/media.entity';
import { MediaRepository } from '../media/repository/media.repository';
import { mediaProviders } from '../media/repository/media.provider';

@Module({
  imports: [
    SequelizeModule.forFeature([RealEstateAgency, Conversation, Message, MessageQueue, Media]),
  ],
  providers: [
    AgenticService,
    AgentOrchestrator,
    VerificationService,
    ChattyAgent,
    GrokService,
    MessageQueueService,
    OutboundWhatsAppClient,
    ConversationTool,
    MessagePersistenceTool,
    RelevanceAssessmentTool,
    DatabaseTool,
    VerifiedMediaProcessorService,
    MediaProcessingService,
    AdobePdfService,
    MediaUploadService,
    DigitalOceanSpacesService,
    MediaRepository,
    ...mediaProviders,
  ],
  exports: [AgenticService],
})
export class AgenticModule {}
