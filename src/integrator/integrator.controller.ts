import { Controller,  Post } from '@nestjs/common';
import { IntegratorService } from './integrator.service';
import { Public } from '../auth/decorators/public.decorator';

@Controller('integrator')
export class IntegratorController {
  constructor(private readonly integratorService: IntegratorService) {}

  @Public()
  @Post('/run')
  run() {
    return this.integratorService.run();
  }
}
