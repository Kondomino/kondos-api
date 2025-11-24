import { Module } from '@nestjs/common';
import { IntegratorService } from './integrator.service';
import { IntegratorController } from './integrator.controller';
import { kondoProviders } from '../kondo/repository/kondo.provider';
import { KondoRepository } from '../kondo/repository/kondo.repository';
import { SlugifyModule } from '../utils/slugify/slugify.module';

@Module({
  controllers: [IntegratorController],
  providers: [IntegratorService, ...kondoProviders, KondoRepository],
  imports: [SlugifyModule]
})
export class IntegratorModule {}
