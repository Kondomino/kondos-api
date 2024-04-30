import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { IntegratorService } from './integrator.service';
import { CreateIntegratorDto } from './dto/create-integrator.dto';
import { UpdateIntegratorDto } from './dto/update-integrator.dto';

@Controller('integrator')
export class IntegratorController {
  constructor(private readonly integratorService: IntegratorService) {}

  @Post('/run')
  run() {
    return this.integratorService.run();
  }
}
