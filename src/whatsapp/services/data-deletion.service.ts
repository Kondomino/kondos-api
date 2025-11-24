import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Message } from '../entities/message.entity';
import { Conversation } from '../entities/conversation.entity';
import { RealEstateAgency } from '../entities/real-estate-agency.entity';
import { User } from '../../user/entities/user.entity';
import * as crypto from 'crypto';

export interface SignedRequestData {
  algorithm: string;
  expires: number;
  issued_at: number;
  user_id: string;
}

export interface DataDeletionRequest {
  id: string;
  user_id: string;
  status: 'pending' | 'completed' | 'failed';
  created_at: Date;
  completed_at?: Date;
  confirmation_code: string;
}

@Injectable()
export class DataDeletionService {
  private readonly logger = new Logger(DataDeletionService.name);
  private readonly appSecret = process.env.WHATSAPP_CLIENT_SECRET;
  private readonly dataDeletionRequests = new Map<string, DataDeletionRequest>();

  constructor(
    @InjectModel(Message)
    private readonly messageModel: typeof Message,
    @InjectModel(Conversation)
    private readonly conversationModel: typeof Conversation,
    @InjectModel(RealEstateAgency)
    private readonly realEstateAgencyModel: typeof RealEstateAgency,
    @InjectModel(User)
    private readonly userModel: typeof User,
  ) {
    this.logger.log('Data Deletion Service initialized');
  }

  /**
   * Validates the signed request from Facebook
   */
  private validateSignedRequest(signedRequest: string): SignedRequestData {
    if (!this.appSecret) {
      throw new BadRequestException('App secret not configured');
    }

    const parts = signedRequest.split('.');
    if (parts.length !== 2) {
      throw new BadRequestException('Invalid signed request format');
    }

    const [encodedPayload, signature] = parts;

    // Verify signature
    const expectedSignature = crypto
      .createHmac('sha256', this.appSecret)
      .update(encodedPayload)
      .digest('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');

    if (signature !== expectedSignature) {
      throw new BadRequestException('Invalid signature');
    }

    // Decode payload
    const payload = Buffer.from(encodedPayload, 'base64').toString('utf8');
    const data: SignedRequestData = JSON.parse(payload);

    // Check if request has expired
    if (data.expires && Date.now() / 1000 > data.expires) {
      throw new BadRequestException('Signed request has expired');
    }

    return data;
  }

  /**
   * Initiates data deletion for a user
   */
  async initiateDataDeletion(signedRequest: string): Promise<{ url: string; confirmation_code: string }> {
    this.logger.log('Initiating data deletion request');

    // Validate signed request
    const data = this.validateSignedRequest(signedRequest);
    const userId = data.user_id;

    this.logger.log(`Processing data deletion for user: ${userId}`);

    // Generate confirmation code
    const confirmationCode = crypto.randomBytes(16).toString('hex');

    // Store deletion request
    const deletionRequest: DataDeletionRequest = {
      id: crypto.randomUUID(),
      user_id: userId,
      status: 'pending',
      created_at: new Date(),
      confirmation_code: confirmationCode,
    };

    this.dataDeletionRequests.set(deletionRequest.id, deletionRequest);

    // Start async deletion process
    this.performDataDeletion(userId, deletionRequest.id).catch(error => {
      this.logger.error(`Data deletion failed for user ${userId}:`, error);
      const request = this.dataDeletionRequests.get(deletionRequest.id);
      if (request) {
        request.status = 'failed';
        this.dataDeletionRequests.set(deletionRequest.id, request);
      }
    });

    return {
      url: `${process.env.APP_URL || 'https://your-domain.com'}/api/whatsapp/data-deletion-status/${deletionRequest.id}`,
      confirmation_code: confirmationCode,
    };
  }

  /**
   * Performs the actual data deletion
   */
  private async performDataDeletion(userId: string, requestId: string): Promise<void> {
    this.logger.log(`Starting data deletion for user: ${userId}`);

    try {
      // Find user by WhatsApp ID or phone number
      const user = await this.userModel.findOne({
        where: {
          whatsapp_id: userId,
        },
      });

      if (!user) {
        this.logger.log(`No user found for WhatsApp ID: ${userId}`);
        // Still mark as completed since there's no data to delete
        const request = this.dataDeletionRequests.get(requestId);
        if (request) {
          request.status = 'completed';
          request.completed_at = new Date();
          this.dataDeletionRequests.set(requestId, request);
        }
        return;
      }

      // Delete user's WhatsApp messages
      const userConversations = await this.conversationModel.findAll({
        where: {
          whatsapp_number: user.phone_number,
        },
      });

      for (const conversation of userConversations) {
        await this.messageModel.destroy({
          where: {
            conversation_id: conversation.id,
          },
        });
        await conversation.destroy();
      }

      // Delete real estate agency if it belongs to this user
      await this.realEstateAgencyModel.destroy({
        where: {
          whatsapp_number: user.phone_number,
        },
      });

      // Delete user data (but keep the user record for audit purposes)
      await user.update({
        whatsapp_id: null,
        phone_number: null,
        email: null,
        firstName: null,
        lastName: null,
        is_deleted: true,
        deleted_at: new Date(),
      });

      this.logger.log(`Data deletion completed for user: ${userId}`);

      // Update request status
      const request = this.dataDeletionRequests.get(requestId);
      if (request) {
        request.status = 'completed';
        request.completed_at = new Date();
        this.dataDeletionRequests.set(requestId, request);
      }

    } catch (error) {
      this.logger.error(`Error during data deletion for user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Gets the status of a data deletion request
   */
  getDeletionStatus(requestId: string): DataDeletionRequest {
    const request = this.dataDeletionRequests.get(requestId);
    if (!request) {
      throw new NotFoundException('Deletion request not found');
    }
    return request;
  }

  /**
   * Validates a confirmation code
   */
  validateConfirmationCode(requestId: string, confirmationCode: string): boolean {
    const request = this.dataDeletionRequests.get(requestId);
    if (!request) {
      return false;
    }
    return request.confirmation_code === confirmationCode;
  }
}
