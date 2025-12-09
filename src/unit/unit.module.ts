import { Module } from '@nestjs/common';
import { UnitService } from './unit.service';
import { UnitController } from './unit.controller';
import { unitProviders } from './repository/unit.provider';
import { UnitRepository } from './repository/unit.repository';
import { Unit } from './entities/unit.entity';
import { SequelizeModule } from '@nestjs/sequelize';

@Module({
  controllers: [UnitController],
  imports: [
    SequelizeModule.forFeature([Unit]), 
  ],
  providers: [UnitService, ...unitProviders, UnitRepository],
})
export class UnitModule {}
