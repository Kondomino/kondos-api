import { PipeTransform, Injectable, BadRequestException } from '@nestjs/common';

@Injectable()
export class ImageValidationPipe implements PipeTransform {
  private readonly allowedMimeTypes = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp'
  ];

  private readonly minSize = 400 * 1024; // 400KB in bytes
  private readonly maxSize = 10 * 1024 * 1024; // 10MB in bytes

  transform(files: Express.Multer.File[]) {
    if (!files || files.length === 0) {
      throw new BadRequestException('No files uploaded');
    }

    if (files.length > 10) {
      throw new BadRequestException('Maximum 10 files allowed per upload');
    }

    const errors: string[] = [];

    for (const file of files) {
      // Validate MIME type
      if (!this.allowedMimeTypes.includes(file.mimetype)) {
        errors.push(
          `${file.originalname}: Invalid file type. Only JPEG, PNG, and WebP images are allowed.`
        );
        continue;
      }

      // Validate minimum size
      if (file.size < this.minSize) {
        errors.push(
          `${file.originalname}: File too small. Minimum size is 400KB (current: ${Math.round(file.size / 1024)}KB).`
        );
        continue;
      }

      // Validate maximum size
      if (file.size > this.maxSize) {
        errors.push(
          `${file.originalname}: File too large. Maximum size is 10MB (current: ${Math.round(file.size / (1024 * 1024))}MB).`
        );
        continue;
      }
    }

    if (errors.length > 0) {
      throw new BadRequestException({
        message: 'File validation failed',
        errors
      });
    }

    return files;
  }
}
