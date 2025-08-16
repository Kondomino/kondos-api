import { Controller, Get, Post, Body, Query, HttpCode, HttpStatus, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery, ApiParam } from '@nestjs/swagger';
import { WhatsappService } from './whatsapp.service';
import { WebhookDto } from './dto/webhook.dto';
import { SendMessageDto } from './dto/send-message.dto';
import { DataDeletionDto, DataDeletionResponseDto } from './dto/data-deletion.dto';
import { DataDeletionService } from './services/data-deletion.service';
import { Public } from '../auth/decorators/public.decorator';

@ApiTags('whatsapp')
@Controller('whatsapp')
export class WhatsappController {
  constructor(
    private readonly whatsappService: WhatsappService,
    private readonly dataDeletionService: DataDeletionService,
  ) {}

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

  @Public()
  @Post('data-deletion')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Facebook Data Deletion Callback',
    description: 'Handles data deletion requests from Facebook/Meta for GDPR compliance. This endpoint receives signed requests from Facebook and initiates the deletion of user data.'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Data deletion initiated successfully',
    type: DataDeletionResponseDto
  })
  @ApiResponse({ status: 400, description: 'Invalid signed request' })
  async initiateDataDeletion(@Body() dataDeletionDto: DataDeletionDto): Promise<DataDeletionResponseDto> {
    return this.dataDeletionService.initiateDataDeletion(dataDeletionDto.signed_request);
  }

  @Public()
  @Get('data-deletion-status/:requestId')
  @ApiOperation({ 
    summary: 'Check Data Deletion Status',
    description: 'Allows users to check the status of their data deletion request using the URL provided in the initial response.'
  })
  @ApiParam({ name: 'requestId', description: 'Unique identifier for the deletion request' })
  @ApiResponse({ status: 200, description: 'Deletion status retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Deletion request not found' })
  async getDataDeletionStatus(@Param('requestId') requestId: string): Promise<any> {
    const status = this.dataDeletionService.getDeletionStatus(requestId);
    return {
      id: status.id,
      status: status.status,
      created_at: status.created_at,
      completed_at: status.completed_at,
      message: this.getStatusMessage(status.status),
    };
  }

  private getStatusMessage(status: string): string {
    switch (status) {
      case 'pending':
        return 'Your data deletion request is being processed. Please check back later.';
      case 'completed':
        return 'Your data has been successfully deleted from our systems.';
      case 'failed':
        return 'There was an error processing your data deletion request. Please contact support.';
      default:
        return 'Unknown status';
    }
  }
}
