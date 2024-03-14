import { Module } from '@nestjs/common';
import { KondoService } from './kondo.service';
import { KondoController } from './kondo.controller';

@Module({
  controllers: [KondoController],
  providers: [KondoService]
})
export class KondoModule {}
