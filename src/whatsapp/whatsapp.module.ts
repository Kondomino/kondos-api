import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { WhatsappController } from './whatsapp.controller';
import { WhatsappService } from './whatsapp.service';
import { ConversationService } from './services/conversation.service';
import { RealEstateAgency } from './entities/real-estate-agency.entity';
import { Conversation } from './entities/conversation.entity';
import { Message } from './entities/message.entity';
import { AgenticModule } from '../agentic/agentic.module';

@Module({
  imports: [
    SequelizeModule.forFeature([RealEstateAgency, Conversation, Message]),
    AgenticModule,
  ],
  controllers: [WhatsappController],
  providers: [WhatsappService, ConversationService],
  exports: [WhatsappService, ConversationService],
})
export class WhatsappModule {}