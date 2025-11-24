import { Module } from '@nestjs/common';
import { UnitService } from './unit.service';
import { UnitController } from './unit.controller';
import { unitProviders } from './repository/unit.provider';
import { UnitRepository } from './repository/unit.repository';

@Module({
  controllers: [UnitController],
  providers: [UnitService, ...unitProviders, UnitRepository],
})
export class UnitModule {}
