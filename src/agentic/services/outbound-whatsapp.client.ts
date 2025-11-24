import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

type OutboundMessageType = 'text' | 'image' | 'document';

interface OutboundMessageInput {
  to: string;
  type: OutboundMessageType;
  text?: string;
  mediaUrl?: string;
}

@Injectable()
export class OutboundWhatsAppClient {
  private readonly logger = new Logger(OutboundWhatsAppClient.name);
  private readonly phoneNumberId: string;
  private readonly accessToken: string;

  constructor(private readonly configService: ConfigService) {
    this.phoneNumberId = this.configService.get<string>('WHATSAPP_PHONE_NUMBER_ID');
    this.accessToken = this.configService.get<string>('WHATSAPP_ACCESS_TOKEN');

    if (!this.phoneNumberId) {
      this.logger.error('WHATSAPP_PHONE_NUMBER_ID is not configured');
    }
    if (!this.accessToken) {
      this.logger.error('WHATSAPP_ACCESS_TOKEN is not configured');
    }
  }

  async send(input: OutboundMessageInput): Promise<void> {
    const url = `https://graph.facebook.com/v20.0/${this.phoneNumberId}/messages`;

    const payload: any = {
      messaging_product: 'whatsapp',
      to: input.to,
      type: input.type,
    };

    if (input.type === 'text' && input.text) {
      payload.text = { body: input.text };
    } else if (input.type === 'image' && input.mediaUrl) {
      payload.image = { link: input.mediaUrl };
    } else if (input.type === 'document' && input.mediaUrl) {
      payload.document = { link: input.mediaUrl };
    }

    this.logger.log(`Outbound WA payload: ${JSON.stringify(payload)}`);

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const responseData = await response.json();
    if (!response.ok) {
      this.logger.error(`WhatsApp send error: ${response.status} - ${JSON.stringify(responseData)}`);
      throw new Error(responseData?.error?.message || 'WhatsApp send failed');
    }

    this.logger.log(`WhatsApp send ok: ${JSON.stringify(responseData)}`);
  }
}


