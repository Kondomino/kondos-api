import { Controller, Post, Body } from '@nestjs/common';
    import { LangGraphService } from './langgraph.service';
    import { MetaAdapter } from './meta.adapter';
    import { DatabaseAdapter } from '../database/database.adapter';
    import * as PDFServicesSdk from '@adobe/pdfservices-node-sdk';
    import * as AWS from 'aws-sdk';
    import { randomUUID } from 'crypto';

    @Controller('whatsapp')
    export class WhatsAppController {
      private s3: AWS.S3;

      constructor(
        private langGraphService: LangGraphService,
        private metaAdapter: MetaAdapter,
        private database: DatabaseAdapter,
      ) {
        this.s3 = new AWS.S3({
          endpoint: process.env.DO_SPACES_ENDPOINT,
          accessKeyId: process.env.DO_SPACES_KEY,
          secretAccessKey: process.env.DO_SPACES_SECRET,
        });
      }

      @Post('webhook')
      async handleWebhook(@Body() payload: any) {
        const message = payload.entry[0]?.changes[0]?.value?.messages?.[0];
        if (!message) return { status: 'ok' };

        const phone = message.from;
        if (message.document) {
          // Download PDF from WhatsApp
          const pdfBuffer = await this.metaAdapter.downloadMedia(message.document.url);

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
          const extractedData = await result.getContent();
          const images = extractedData.images || [];

          // Upload images to DigitalOcean Spaces
          const imageUrls = await this.uploadImagesToSpaces(images);

          // Save to PostgreSQL
          await this.database.saveDocument({
            id: randomUUID(),
            phone,
            extracted_data: extractedData.elements,
            image_urls: imageUrls,
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
        const urls: string[] = [];
        for (const [index, image] of images.entries()) {
          const key = `images/${randomUUID()}.jpg`;
          await this.s3
            .upload({
              Bucket: process.env.DO_SPACES_BUCKET,
              Key: key,
              Body: image,
              ACL: 'public-read', // Adjust for private access if needed
            })
            .promise();
          urls.push(`https://${process.env.DO_SPACES_BUCKET}.${process.env.DO_SPACES_ENDPOINT}/${key}`);
        }
        return urls;
      }
    }