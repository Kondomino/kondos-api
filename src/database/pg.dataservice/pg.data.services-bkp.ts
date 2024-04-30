import { Inject, Injectable, OnApplicationBootstrap } from '@nestjs/common';
import { User } from 'src/user/entities/user.entity';
import { Kondo } from 'src/kondo/entities/Kondo.entity';
import { IDataServices } from './idata.services';
import { PostgresGenericRepository } from '../repositories/pg.generic.repository';
import { InjectModel } from '@nestjs/sequelize';
import { Model } from 'sequelize-typescript';

@Injectable()
export class PostgresDataServices
  implements IDataServices, OnApplicationBootstrap
{
  users: PostgresGenericRepository<User>;
  kondos: PostgresGenericRepository<Kondo>;

  constructor(
    @Inject(`User`)
    private UserRepository: Model<User>,
    @Inject('Kondo')
    private KondoRepository: Model<Kondo>,
  ) {}

  onApplicationBootstrap() {
    this.users = new PostgresGenericRepository<User>(this.UserRepository);
    this.kondos = new PostgresGenericRepository<Kondo>(this.KondoRepository);
  }
}