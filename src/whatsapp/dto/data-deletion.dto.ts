import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';

export class DataDeletionDto {
  @ApiProperty({
    description: 'Signed request from Facebook containing user ID and app secret',
    example: 'eyJhbGdvcml0aG0iOiJITUFDLVNIQTI1NiIsImV4cGlyZXMiOjE2MzQ1Njc4OTksImlzc3VlZF9hdCI6MTYzNDU2NDI5OSwidXNlcl9pZCI6IjEyMzQ1Njc4OTAifQ==.signature'
  })
  @IsString()
  @IsNotEmpty()
  signed_request: string;
}

export class DataDeletionResponseDto {
  @ApiProperty({
    description: 'URL where the user can check the status of their data deletion request',
    example: 'https://your-domain.com/api/whatsapp/data-deletion-status/123456789'
  })
  url: string;

  @ApiProperty({
    description: 'Confirmation code for the data deletion request',
    example: 'abc123def456'
  })
  confirmation_code: string;
}
