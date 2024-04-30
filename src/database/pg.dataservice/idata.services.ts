import { Kondo } from 'src/kondo/entities/Kondo.entity';
import { User } from 'src/user/entities/user.entity';
import { IGenericRepository } from '../repositories/igeneric.repository';

export abstract class IDataServices {
  abstract kondos: IGenericRepository<Kondo>;
  
  abstract users: IGenericRepository<User>;
}