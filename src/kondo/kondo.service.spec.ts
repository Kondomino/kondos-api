import { Test, TestingModule } from '@nestjs/testing';
import { KondoService } from './kondo.service';

describe('KondoService', () => {
  let service: KondoService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [KondoService],
    }).compile();

    service = module.get<KondoService>(KondoService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
