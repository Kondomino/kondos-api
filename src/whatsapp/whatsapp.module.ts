import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { WhatsappController } from './whatsapp.controller';
import { WhatsappService } from './whatsapp.service';
import { ConversationService } from './services/conversation.service';
import { DataDeletionService } from './services/data-deletion.service';
import { MediaProcessingService } from './services/media-processing.service';
import { AdobePdfService } from './services/adobe-pdf.service';
import { MediaUploadService } from './services/media-upload.service';
import { VerifiedMediaProcessorService } from './services/verified-media-processor.service';
import { DigitalOceanSpacesService } from './services/digital-ocean-spaces.service';
import { WhatsAppMediaService } from './services/whatsapp-media.service';
import { RealEstateAgency } from './entities/real-estate-agency.entity';
import { Conversation } from './entities/conversation.entity';
import { Message } from './entities/message.entity';
import { User } from '../user/entities/user.entity';
import { AgenticModule } from '../agentic/agentic.module';
import { GrokService } from '../agentic/agents/chatty/grok.service';

@Module({
  imports: [
    SequelizeModule.forFeature([RealEstateAgency, Conversation, Message, User]),
    AgenticModule,
  ],
  controllers: [WhatsappController],
  providers: [
    WhatsappService, 
    ConversationService, 
    DataDeletionService, 
    GrokService,
    MediaProcessingService,
    AdobePdfService,
    MediaUploadService,
    VerifiedMediaProcessorService,
    DigitalOceanSpacesService,
    WhatsAppMediaService,
  ],
  exports: [WhatsappService, ConversationService, DataDeletionService, MediaProcessingService],
})
export class WhatsappModule {}