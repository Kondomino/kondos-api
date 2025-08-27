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
    caption?: string;
  };

  @ApiProperty({ description: 'Message document content', required: false })
  @IsOptional()
  document?: {
    id: string;
    filename: string;
    mime_type: string;
    sha256: string;
    caption?: string;
  };

  @ApiProperty({ description: 'Message video content', required: false })
  @IsOptional()
  video?: {
    id: string;
    mime_type: string;
    sha256: string;
    caption?: string;
  };

  @ApiProperty({ description: 'Message audio content', required: false })
  @IsOptional()
  audio?: {
    id: string;
    mime_type: string;
    sha256: string;
  };
}

export class ContactProfileDto {
  @ApiProperty({ description: 'Contact name' })
  @IsString()
  name: string;

  @ApiProperty({ description: 'Business profile information', required: false })
  @IsOptional()
  business?: {
    business_name?: string;
    website?: string[];
    email?: string;
    category?: string;
    description?: string;
  };
}

export class ContactDto {
  @ApiProperty({ description: 'WhatsApp ID' })
  @IsString()
  wa_id: string;

  @ApiProperty({ description: 'Contact profile' })
  @ValidateNested()
  @Type(() => ContactProfileDto)
  profile: ContactProfileDto;
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

  @ApiProperty({ description: 'Contacts array', type: [ContactDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ContactDto)
  @IsOptional()
  contacts?: ContactDto[];
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
