import { Test, TestingModule } from '@nestjs/testing';
import { IntegratorController } from './integrator.controller';
import { IntegratorService } from './integrator.service';

describe('IntegratorController', () => {
  let controller: IntegratorController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [IntegratorController],
      providers: [IntegratorService],
    }).compile();

    controller = module.get<IntegratorController>(IntegratorController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
