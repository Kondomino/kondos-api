export interface IncomingMessage {
  phoneNumber: string;
  content: string;
  messageType: 'text' | 'image' | 'document' | 'audio' | 'video' | 'location' | 'contact' | 'sticker';
  timestamp: Date;
  whatsappMessageId: string;
  mediaData?: {
    mediaId?: string;
    mediaUrl?: string;
    filename?: string;
    mimeType?: string;
    size?: number;
  };
}

export interface AgentResponse {
  shouldRespond: boolean;
  message?: string;
  messageType?: 'text' | 'image' | 'document';
  conversationId?: number;
  agencyId?: number;
  metadata?: any;
}

export interface VerificationResult {
  isRealEstateAgent: boolean;
  confidence: number; // 0-1
  reasoning: string;
  shouldAskForClarification: boolean;
  existingAgency?: {
    id: number;
    name: string;
    phone_number: string;
  };
}

export interface ConversationContext {
  agencyId: number;
  conversationId: number;
  messageHistory: Array<{
    content: string;
    direction: 'incoming' | 'outgoing';
    timestamp: Date;
    messageType: string;
  }>;
  agentName?: string;
  lastInteraction: Date;
}
