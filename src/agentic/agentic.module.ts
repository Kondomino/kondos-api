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
import { WhatsappModule } from '../whatsapp/whatsapp.module';

@Module({
  imports: [
    SequelizeModule.forFeature([RealEstateAgency, Conversation, Message, MessageQueue]),
    WhatsappModule, // Import WhatsappModule to access WhatsappService
  ],
  providers: [
    AgenticService,
    AgentOrchestrator,
    VerificationService,
    ChattyAgent,
    GrokService,
    MessageQueueService,
    ConversationTool,
    MessagePersistenceTool,
    RelevanceAssessmentTool,
    DatabaseTool,
  ],
  exports: [AgenticService],
})
export class AgenticModule {}
