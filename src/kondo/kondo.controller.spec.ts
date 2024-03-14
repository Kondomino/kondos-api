import { Test, TestingModule } from '@nestjs/testing';
import { KondoController } from './kondo.controller';
import { KondoService } from './kondo.service';

describe('KondoController', () => {
  let controller: KondoController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [KondoController],
      providers: [KondoService],
    }).compile();

    controller = module.get<KondoController>(KondoController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
