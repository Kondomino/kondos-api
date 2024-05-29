import { Controller,  Post } from '@nestjs/common';
import { IntegratorService } from './integrator.service';

@Controller('integrator')
export class IntegratorController {
  constructor(private readonly integratorService: IntegratorService) {}

  @Post('/run')
  run() {
    return this.integratorService.run();
  }
}
