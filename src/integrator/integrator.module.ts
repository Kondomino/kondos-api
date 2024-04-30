import { Module } from '@nestjs/common';
import { IntegratorService } from './integrator.service';
import { IntegratorController } from './integrator.controller';
import { SlugifyService } from 'src/utils/slugify/slugify.service';
import { SlugifyModule } from 'src/utils/slugify/slugify.module';
import { SequelizeModule } from '@nestjs/sequelize';
import { Kondo } from 'src/kondo/entities/Kondo.entity';

@Module({
  controllers: [IntegratorController],
  providers: [IntegratorService],
  imports: [SlugifyModule]
})
export class IntegratorModule {}
