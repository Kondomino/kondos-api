import { Inject, Injectable, OnApplicationBootstrap } from '@nestjs/common';
import { User } from 'src/user/entities/user.entity';
import { Kondo } from 'src/kondo/entities/Kondo.entity';
import { IDataServices } from './idata.services';
import { PostgresGenericRepository } from '../repositories/pg.generic.repository';
import { InjectModel } from '@nestjs/sequelize';
import { Model } from 'sequelize-typescript';
import { KONDO_REPOSITORY, USER_REPOSITORY } from 'src/core/constants';

@Injectable()
export class PostgresDataServices
  implements IDataServices, OnApplicationBootstrap
{
  users: PostgresGenericRepository<User>;
  kondos: PostgresGenericRepository<Kondo>;

  constructor(
    @Inject(USER_REPOSITORY) private readonly userRepository: Model<User>,
    @Inject(KONDO_REPOSITORY) private readonly kondoRepository: Model<Kondo>
  ) {}

  onApplicationBootstrap() {
    this.users = new PostgresGenericRepository<User>(this.userRepository);
    this.kondos = new PostgresGenericRepository<Kondo>(this.kondoRepository);
  }
}