import { Test, TestingModule } from '@nestjs/testing';
import { IntegratorService } from './integrator.service';

describe('IntegratorService', () => {
  let service: IntegratorService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [IntegratorService],
    }).compile();

    service = module.get<IntegratorService>(IntegratorService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
