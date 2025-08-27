import { Controller, Post, Body } from '@nestjs/common';
import { LangGraphService } from './langgraph.service';
import { MetaAdapter } from './meta.adapter';
import { DatabaseAdapter } from '../database/database.adapter';
import * as PDFServicesSdk from '@adobe/pdfservices-node-sdk';
import { randomUUID } from 'crypto';

@Controller('whatsapp')
export class WhatsAppController {
  constructor(
    private langGraphService: LangGraphService,
    private metaAdapter: MetaAdapter,
    private database: DatabaseAdapter,
  ) {}

  @Post('webhook')
  async handleWebhook(@Body() payload: any) {
    const message = payload.entry[0]?.changes[0]?.value?.messages?.[0];
    if (!message) return { status: 'ok' };

    const phone = message.from;
    if (message.document) {
      // Download PDF from WhatsApp
      const pdfUrl = message.document.url;
      const pdfBuffer = await this.metaAdapter.downloadMedia(pdfUrl);

      // Adobe PDF Extract API
      const credentials = PDFServicesSdk.Credentials.serviceAccountCredentialsBuilder()
        .withClientId(process.env.PDF_SERVICES_CLIENT_ID)
        .withClientSecret(process.env.PDF_SERVICES_CLIENT_SECRET)
        .build();
      const client = PDFServicesSdk.Client.init(credentials);
      const operation = client.createOperation('ExtractPDF');
      operation.setInput(PDFServicesSdk.FileRef.createFromBuffer(pdfBuffer, 'application/pdf'));
      operation.setOptions({ elementsToExtract: ['text', 'tables', 'images'] });

      const result = await operation.execute();
      const extractedData = await result.getContent(); // JSON with text, tables, images
      const images = extractedData.images || []; // Array of image buffers

      // Save to PostgreSQL
      await this.database.saveDocument({
        id: randomUUID(),
        phone,
        extracted_data: extractedData.elements,
        image_urls: await this.uploadImagesToSpaces(images),
      });

      // Trigger LangGraph
      const state = { phone, isKnownContact: false, messages: [], extractedData: extractedData.elements };
      const result = await this.langGraphService.graph.invoke(state);
      if (result.messages.length > 0) {
        await this.metaAdapter.sendMessage(phone, result.messages[result.messages.length - 1].content);
      }
    }

    return { status: 'ok' };
  }

  async uploadImagesToSpaces(images: Buffer[]): Promise<string[]> {
    // Upload to Render.com disk or DigitalOcean Spaces
    return [];
  }
}