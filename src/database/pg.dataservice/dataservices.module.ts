import { Module } from '@nestjs/common';
import { PostgresDataServicesModule } from './pg.dataservice.module';

@Module({
  imports: [PostgresDataServicesModule],
  exports: [PostgresDataServicesModule],
})
export class DataServicesModule {}