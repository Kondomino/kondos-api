import { Controller, Post, Get, Param, Body, ParseIntPipe } from '@nestjs/common';
import { AIComposerService } from './ai-composer.service';
import { ComposeOptions } from './interfaces/composition-result.interface';
import { Public } from 'src/auth/decorators/public.decorator';

@Controller('ai-composer')
export class AIComposerController {
  constructor(private readonly aiComposerService: AIComposerService) {}

  /**
   * Compose AI-enhanced description and amenities for a kondo
   * POST /ai-composer/compose/:id
   * Body: { force?: boolean }
   */
  @Public()
  @Post('compose/:id')
  async compose(
    @Param('id', ParseIntPipe) id: number,
    @Body() options?: ComposeOptions,
  ) {
    return this.aiComposerService.composeKondo(id, options);
  }

  /**
   * Get composition status for a kondo
   * GET /ai-composer/status/:id
   */
  @Public()
  @Get('status/:id')
  async getStatus(@Param('id', ParseIntPipe) id: number) {
    return this.aiComposerService.getCompositionStatus(id);
  }
}
