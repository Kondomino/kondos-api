export interface AIResponse {
  message: string;
  type: 'text' | 'image' | 'document';
  mediaUrl?: string;
  quickReplies?: string[];
}

export class AIAgentMock {
  private readonly responses: Map<string, AIResponse[]> = new Map();

  constructor() {
    this.initializeResponses();
  }

  private initializeResponses(): void {
    // Greeting responses
    this.responses.set('greeting', [
      {
        message: "Olá! 👋 Bem-vindo ao Kondomino! Como posso ajudá-lo hoje?",
        type: 'text',
        quickReplies: ['Ver apartamentos', 'Falar com corretor', 'Agendar visita']
      },
      {
        message: "Oi! 😊 Que bom ter você por aqui! Está procurando um apartamento?",
        type: 'text',
        quickReplies: ['Sim, quero ver opções', 'Preciso de ajuda', 'Informações sobre o condomínio']
      }
    ]);

    // Apartment search responses
    this.responses.set('apartment_search', [
      {
        message: "Perfeito! 🏠 Temos várias opções incríveis. Que tipo de apartamento você está procurando?",
        type: 'text',
        quickReplies: ['1 quarto', '2 quartos', '3 quartos', 'Cobertura']
      },
      {
        message: "Ótima escolha! 📍 Em que região você gostaria de morar?",
        type: 'text',
        quickReplies: ['Centro', 'Zona Sul', 'Zona Norte', 'Zona Oeste']
      }
    ]);

    // Price inquiries
    this.responses.set('price', [
      {
        message: "💰 Nossos preços variam de R$ 200.000 a R$ 800.000. Qual é o seu orçamento?",
        type: 'text',
        quickReplies: ['Até R$ 300.000', 'R$ 300.000 - R$ 500.000', 'Acima de R$ 500.000']
      },
      {
        message: "💵 Temos opções para todos os bolsos! Posso te mostrar algumas opções dentro do seu orçamento.",
        type: 'text',
        quickReplies: ['Ver opções', 'Falar sobre financiamento', 'Agendar visita']
      }
    ]);

    // Visit scheduling
    this.responses.set('visit', [
      {
        message: "📅 Claro! Que dia seria melhor para você?",
        type: 'text',
        quickReplies: ['Hoje', 'Amanhã', 'Fim de semana', 'Próxima semana']
      },
      {
        message: "🏠 Perfeito! Vou agendar sua visita. Que horário prefere?",
        type: 'text',
        quickReplies: ['Manhã', 'Tarde', 'Noite']
      }
    ]);

    // General help
    this.responses.set('help', [
      {
        message: "🤝 Estou aqui para ajudar! Posso te auxiliar com:\n• Busca de apartamentos\n• Informações sobre preços\n• Agendamento de visitas\n• Dúvidas sobre o condomínio",
        type: 'text',
        quickReplies: ['Buscar apartamentos', 'Ver preços', 'Agendar visita', 'Falar com corretor']
      },
      {
        message: "💡 Precisa de ajuda? Não se preocupe! Sou especialista em encontrar o apartamento perfeito para você.",
        type: 'text',
        quickReplies: ['Quero ver opções', 'Tenho dúvidas', 'Falar com humano']
      }
    ]);

    // Default responses
    this.responses.set('default', [
      {
        message: "Desculpe, não entendi. Pode reformular sua pergunta? 😊",
        type: 'text',
        quickReplies: ['Ver apartamentos', 'Falar com corretor', 'Preciso de ajuda']
      },
      {
        message: "Hmm, não tenho certeza do que você quer dizer. Posso te ajudar com busca de apartamentos, preços ou agendamento de visitas!",
        type: 'text',
        quickReplies: ['Buscar apartamentos', 'Ver preços', 'Agendar visita']
      }
    ]);
  }

  public getResponse(userMessage: string): AIResponse {
    const message = userMessage.toLowerCase();
    
    // Simple keyword matching
    if (this.containsKeywords(message, ['oi', 'olá', 'hello', 'hi', 'bom dia', 'boa tarde', 'boa noite'])) {
      return this.getRandomResponse('greeting');
    }
    
    if (this.containsKeywords(message, ['apartamento', 'casa', 'imóvel', 'moradia', 'residência'])) {
      return this.getRandomResponse('apartment_search');
    }
    
    if (this.containsKeywords(message, ['preço', 'valor', 'quanto custa', 'custa', 'dinheiro'])) {
      return this.getRandomResponse('price');
    }
    
    if (this.containsKeywords(message, ['visita', 'agendar', 'marcar', 'ver pessoalmente', 'conhecer'])) {
      return this.getRandomResponse('visit');
    }
    
    if (this.containsKeywords(message, ['ajuda', 'help', 'socorro', 'não sei', 'dúvida'])) {
      return this.getRandomResponse('help');
    }
    
    // Default response if no keywords match
    return this.getRandomResponse('default');
  }

  private containsKeywords(message: string, keywords: string[]): boolean {
    return keywords.some(keyword => message.includes(keyword));
  }

  private getRandomResponse(category: string): AIResponse {
    const responses = this.responses.get(category) || this.responses.get('default')!;
    const randomIndex = Math.floor(Math.random() * responses.length);
    return responses[randomIndex];
  }

  public getWelcomeMessage(): AIResponse {
    return {
      message: "🎉 Bem-vindo ao Kondomino! Sou seu assistente virtual e estou aqui para te ajudar a encontrar o apartamento dos seus sonhos!",
      type: 'text',
      quickReplies: ['Ver apartamentos', 'Falar com corretor', 'Preciso de ajuda']
    };
  }

  public getFollowUpMessage(previousCategory: string): AIResponse {
    // Generate follow-up messages based on previous interaction
    const followUps: Map<string, AIResponse[]> = new Map();
    
    followUps.set('apartment_search', [
      {
        message: "Que tal eu te mostrar algumas fotos dos nossos apartamentos? 📸",
        type: 'text',
        quickReplies: ['Sim, quero ver!', 'Prefiro agendar visita', 'Falar sobre preços']
      }
    ]);
    
    followUps.set('price', [
      {
        message: "Posso te ajudar com opções de financiamento também! 💳",
        type: 'text',
        quickReplies: ['Sim, me interessei', 'Quero ver apartamentos', 'Falar com corretor']
      }
    ]);
    
    const responses = followUps.get(previousCategory) || this.getRandomResponse('default');
    return Array.isArray(responses) ? responses[0] : responses;
  }
}
