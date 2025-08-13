import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { VerificationService } from './orchestrator/verification.service';
import { AgenticService } from './agentic.service';
import { DatabaseTool } from './tools/database.tool';
import { RealEstateAgency } from '../whatsapp/entities/real-estate-agency.entity';
import { Conversation } from '../whatsapp/entities/conversation.entity';
import { Message } from '../whatsapp/entities/message.entity';
import { AgentOrchestrator } from './orchestrator/agent.orchestrator';
import { ChattyAgent } from './agents/chatty/chatty.agent';
import { ConversationTool } from './tools/conversation.tool';
import { MessagePersistenceTool, RelevanceAssessmentTool } from './tools/message-persistence.tool';

@Module({
  imports: [
    SequelizeModule.forFeature([RealEstateAgency, Conversation, Message])
  ],
  providers: [
    AgenticService,
    AgentOrchestrator,
    VerificationService,
    ChattyAgent,
    ConversationTool,
    MessagePersistenceTool,
    RelevanceAssessmentTool,
    DatabaseTool,
  ],
  exports: [AgenticService],
})
export class AgenticModule {}
