import { Test, TestingModule } from '@nestjs/testing';
import { AgentOrchestrator } from './orchestrator/agent.orchestrator';
import { GrokService } from './agents/chatty/grok.service';
import { IncomingMessage } from './interfaces/agent.interface';
import { ChattyAgent } from './agents/chatty/chatty.agent';
import { ConversationTool } from './tools/conversation.tool';
import { MessagePersistenceTool, RelevanceAssessmentTool } from './tools/message-persistence.tool';
import { DatabaseTool } from './tools/database.tool';
import { VerificationService } from './orchestrator/verification.service';

describe('AgenticModule integration', () => {
  let moduleRef: TestingModule;
  let orchestrator: AgentOrchestrator;
  let grokMock: { generateResponse: jest.Mock };

  // In-memory stores to assert DB-like side effects
  const agencies: Array<{ id: number; name: string; phone_number: string } & Record<string, any>> = [];
  const conversations: Array<{ id: number; real_estate_agency_id: number; whatsapp_number: string; agent_name?: string; status: string; metadata?: any; updated_at?: Date } & Record<string, any>> = [];
  const messages: Array<{ id: number; conversation_id: number; whatsapp_message_id: string; direction: 'incoming' | 'outgoing'; message_type: string; text_content?: string; timestamp: Date; metadata?: any }> = [];

  beforeAll(async () => {
    grokMock = {
      generateResponse: jest.fn(async () => 'Olá! Como posso ajudar com os imóveis?'),
    };

    // Simple in-memory DatabaseTool mock
    const databaseToolMock: Partial<DatabaseTool> = {
      async findOrCreateConversation(agencyId: number, whatsappNumber: string, agentName?: string) {
        let convo = conversations.find(c => c.real_estate_agency_id === agencyId && c.whatsapp_number === whatsappNumber && c.status === 'active');
        if (!convo) {
          convo = {
            id: conversations.length + 1,
            real_estate_agency_id: agencyId,
            whatsapp_number: whatsappNumber,
            agent_name: agentName,
            status: 'active',
            metadata: { created_by: 'agentic_orchestrator', created_at: new Date() },
            updated_at: new Date(),
          } as any;
          conversations.push(convo);
        }
        return convo as any;
      },
      async getConversationContext(conversationId: number, limit = 50) {
        const convo = conversations.find(c => c.id === conversationId);
        if (!convo) return null;
        const history = messages
          .filter(m => m.conversation_id === conversationId)
          .slice(-limit)
          .map(m => ({ content: m.text_content || '[Media message]', direction: m.direction, timestamp: m.timestamp, messageType: m.message_type }));
        return {
          agencyId: convo.real_estate_agency_id,
          conversationId: convo.id,
          messageHistory: history,
          agentName: convo.agent_name,
          lastInteraction: history[history.length - 1]?.timestamp || new Date(),
        } as any;
      },
      async saveMessage(conversationId: number, whatsappMessageId: string, direction: 'incoming' | 'outgoing', messageType: string, textContent?: string, mediaData?: any) {
        const msg = {
          id: messages.length + 1,
          conversation_id: conversationId,
          whatsapp_message_id: whatsappMessageId,
          direction,
          message_type: messageType,
          text_content: textContent,
          timestamp: new Date(),
          metadata: mediaData?.metadata,
        } as any;
        messages.push(msg);
        const convo = conversations.find(c => c.id === conversationId);
        if (convo) convo.updated_at = new Date();
        return msg as any;
      },
      async updateConversationMetadata(conversationId: number, metadata: any) {
        const convo = conversations.find(c => c.id === conversationId);
        if (convo) convo.metadata = { ...(convo.metadata || {}), ...metadata };
      },
      async getAgencyByPhone(phoneNumber: string) {
        return (agencies.find(a => a.phone_number === phoneNumber) as any) || null;
      },
    };

    // Simple mock VerificationService
    const verificationServiceMock: Partial<VerificationService> = {
      async verifyAgent(phoneNumber: string, messageContent: string) {
        const existing = agencies.find(a => a.phone_number === phoneNumber);
        if (existing) {
          return {
            isRealEstateAgent: true,
            confidence: 1.0,
            reasoning: 'existing',
            shouldAskForClarification: false,
            existingAgency: { id: existing.id, name: existing.name, phone_number: existing.phone_number },
          } as any;
        }
        const isAgent = /imov(e|é)is|corretor|imobili[aá]ria|apartamento|casa/i.test(messageContent);
        return {
          isRealEstateAgent: isAgent,
          confidence: isAgent ? 0.9 : 0.2,
          reasoning: 'mocked',
          shouldAskForClarification: !isAgent,
        } as any;
      },
      async createAgencyFromVerification(phoneNumber: string, messageContent: string) {
        const agency = { id: agencies.length + 1, name: `Agência ${phoneNumber}`, phone_number: phoneNumber } as any;
        agencies.push(agency);
        return agency;
      },
    };

    moduleRef = await Test.createTestingModule({
      providers: [
        AgentOrchestrator,
        ChattyAgent,
        ConversationTool,
        MessagePersistenceTool,
        RelevanceAssessmentTool,
        { provide: DatabaseTool, useValue: databaseToolMock },
        { provide: VerificationService, useValue: verificationServiceMock },
        { provide: GrokService, useValue: grokMock },
      ],
    }).compile();

    orchestrator = moduleRef.get(AgentOrchestrator);
  });

  afterAll(async () => {
    await moduleRef.close();
  });

  it('calls Grok and persists an outgoing message', async () => {
    const incoming: IncomingMessage = {
      phoneNumber: '5511999999999',
      content: 'Sou corretor de imóveis, tenho apartamentos disponíveis no centro.',
      messageType: 'text',
      timestamp: new Date(),
      whatsappMessageId: 'wamid.123',
    };

    const response = await orchestrator.processMessage(incoming);

    // Model (Grok) was called with constructed messages
    expect(grokMock.generateResponse).toHaveBeenCalledTimes(1);

    // Flow: should respond with the mocked text
    expect(response.shouldRespond).toBe(true);
    expect(response.message).toBe('Olá! Como posso ajudar com os imóveis?');

    // DB: Agency created
    const agency = agencies.find(a => a.phone_number === incoming.phoneNumber);
    expect(agency).toBeTruthy();

    // DB: At least one conversation exists (orchestrator-level)
    const convos = conversations.filter(c => c.real_estate_agency_id === agency!.id);
    expect(convos.length).toBeGreaterThanOrEqual(1);

    // DB: Outgoing message was saved (by the agent chain)
    const outgoing = messages.find(m => m.direction === 'outgoing');
    expect(outgoing).toBeTruthy();
    expect(outgoing!.text_content).toBe('Olá! Como posso ajudar com os imóveis?');
  });

  it('analyzes, searches DB, and decides next move (creates agency and conversation)', async () => {
    const incoming: IncomingMessage = {
      phoneNumber: '5541999999999',
      content: 'Trabalho com imóveis e posso apresentar um apartamento com 2 dormitórios.',
      messageType: 'text',
      timestamp: new Date(),
      whatsappMessageId: 'wamid.456',
    };

    const result = await orchestrator.processMessage(incoming);

    // Flow decided to respond
    expect(result.shouldRespond).toBe(true);

    // Agency is created and linked
    const agency = agencies.find(a => a.phone_number === incoming.phoneNumber);
    expect(agency).toBeTruthy();

    // Orchestrator creates a conversation for the phone number
    const convoWithPhone = conversations.find(c => c.real_estate_agency_id === agency!.id && c.whatsapp_number === incoming.phoneNumber);
    expect(convoWithPhone).toBeTruthy();

    // At least one outgoing message exists in the DB after processing
    const outMsgs = messages.filter(m => m.direction === 'outgoing');
    expect(outMsgs.length).toBeGreaterThan(0);
  });
});
