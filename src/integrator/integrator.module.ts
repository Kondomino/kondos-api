import { Module } from '@nestjs/common';
import { IntegratorService } from './integrator.service';
import { IntegratorController } from './integrator.controller';
import { SlugifyModule } from 'src/utils/slugify/slugify.module';
import { kondoProviders } from 'src/kondo/repository/kondo.provider';
import { KondoRepository } from 'src/kondo/repository/kondo.repository';

@Module({
  controllers: [IntegratorController],
  providers: [IntegratorService, ...kondoProviders, KondoRepository],
  imports: [SlugifyModule]
})
export class IntegratorModule {}
