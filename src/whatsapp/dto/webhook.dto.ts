import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsArray, IsOptional, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class MessageDto {
  @ApiProperty({ description: 'Message ID' })
  @IsString()
  id: string;

  @ApiProperty({ description: 'Message type' })
  @IsString()
  type: string;

  @ApiProperty({ description: 'Sender phone number' })
  @IsString()
  from: string;

  @ApiProperty({ description: 'Timestamp' })
  @IsString()
  timestamp: string;

  @ApiProperty({ description: 'Message text content', required: false })
  @IsOptional()
  text?: {
    body: string;
  };

  @ApiProperty({ description: 'Message image content', required: false })
  @IsOptional()
  image?: {
    id: string;
    mime_type: string;
    sha256: string;
  };
}

export class ChangeValueDto {
  @ApiProperty({ description: 'WhatsApp Business Account ID' })
  @IsString()
  @IsOptional()
  messaging_product?: string;

  @ApiProperty({ description: 'Metadata about the change' })
  @IsOptional()
  metadata?: {
    display_phone_number: string;
    phone_number_id: string;
  };

  @ApiProperty({ description: 'Messages array', type: [MessageDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MessageDto)
  @IsOptional()
  messages?: MessageDto[];
}

export class ChangeDto {
  @ApiProperty({ description: 'Change value' })
  @ValidateNested()
  @Type(() => ChangeValueDto)
  value: ChangeValueDto;

  @ApiProperty({ description: 'Change field' })
  @IsString()
  field: string;
}

export class EntryDto {
  @ApiProperty({ description: 'Entry ID' })
  @IsString()
  id: string;

  @ApiProperty({ description: 'Changes array', type: [ChangeDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ChangeDto)
  changes: ChangeDto[];
}

export class WebhookDto {
  @ApiProperty({ description: 'Webhook object type' })
  @IsString()
  object: string;

  @ApiProperty({ description: 'Webhook entries', type: [EntryDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => EntryDto)
  entry: EntryDto[];
}
