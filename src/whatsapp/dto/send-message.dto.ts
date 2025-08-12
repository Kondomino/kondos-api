import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class SendMessageDto {
  @ApiProperty({ 
    description: 'Recipient phone number in international format (e.g., 5511999999999)',
    example: '5511999999999'
  })
  @IsString()
  @IsNotEmpty()
  to: string;

  @ApiProperty({ 
    description: 'Message type',
    example: 'text',
    enum: ['text', 'image', 'document', 'audio', 'video']
  })
  @IsString()
  @IsNotEmpty()
  type: string;

  @ApiProperty({ 
    description: 'Message text content (required for text messages)',
    example: 'Hello! How can I help you today?',
    required: false
  })
  @IsOptional()
  @IsString()
  text?: string;

  @ApiProperty({ 
    description: 'Media URL (required for media messages)',
    example: 'https://example.com/image.jpg',
    required: false
  })
  @IsOptional()
  @IsString()
  mediaUrl?: string;

  @ApiProperty({ 
    description: 'Message preview URL (for link messages)',
    example: 'https://example.com',
    required: false
  })
  @IsOptional()
  @IsString()
  previewUrl?: string;
}
