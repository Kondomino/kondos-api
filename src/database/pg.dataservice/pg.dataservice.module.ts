import { Module } from '@nestjs/common';
import { IDataServices } from 'src/database/pg.dataservice/idata.services';
import { PostgresDataServices } from 'src/database/pg.dataservice/pg.data.services';

@Module({
  imports: [],
  providers: [
    {
      provide: IDataServices,
      useClass: PostgresDataServices,
    },
  ],
  exports: [IDataServices],
})
export class PostgresDataServicesModule {}