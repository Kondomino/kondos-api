import { Controller, Get, Post, Body, Query, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { WhatsappService } from './whatsapp.service';
import { WebhookDto } from './dto/webhook.dto';
import { SendMessageDto } from './dto/send-message.dto';
import { Public } from '../auth/decorators/public.decorator';

@ApiTags('whatsapp')
@Controller('whatsapp')
export class WhatsappController {
  constructor(private readonly whatsappService: WhatsappService) {}

  @Public()
  @Get('webhook')
  @ApiOperation({ summary: 'Verify WhatsApp webhook' })
  @ApiQuery({ name: 'hub.mode', description: 'Webhook mode' })
  @ApiQuery({ name: 'hub.verify_token', description: 'Verification token' })
  @ApiQuery({ name: 'hub.challenge', description: 'Challenge string' })
  @ApiResponse({ status: 200, description: 'Webhook verified successfully' })
  @ApiResponse({ status: 403, description: 'Verification failed' })
  verifyWebhook(
    @Query('hub.mode') mode: string,
    @Query('hub.verify_token') verifyToken: string,
    @Query('hub.challenge') challenge: string,
  ): string {
    return this.whatsappService.verifyWebhook(mode, verifyToken, challenge);
  }

  @Public()
  @Post('webhook')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Handle WhatsApp webhook events' })
  @ApiResponse({ status: 200, description: 'Webhook processed successfully' })
  async handleWebhook(@Body() webhookData: WebhookDto): Promise<string> {
    return this.whatsappService.handleWebhook(webhookData);
  }

  @Post('send-message')
  @ApiOperation({ summary: 'Send a message via WhatsApp' })
  @ApiResponse({ status: 200, description: 'Message sent successfully' })
  async sendMessage(@Body() messageData: SendMessageDto): Promise<any> {
    return this.whatsappService.sendMessage(messageData);
  }

  @Post('validate-token')
  @ApiOperation({ summary: 'Validate and refresh WhatsApp access token' })
  @ApiResponse({ status: 200, description: 'Token validation completed' })
  async validateToken(): Promise<any> {
    return this.whatsappService.validateAndRefreshToken();
  }
}
