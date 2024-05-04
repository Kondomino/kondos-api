import { Module } from '@nestjs/common';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { userProviders } from './repository/user.provider';
import { User } from './entities/user.entity';
import { SequelizeModule } from '@nestjs/sequelize';

@Module({
  controllers: [UserController],
  providers: [UserService, ...userProviders],
  imports: [SequelizeModule.forFeature([User])]
})
export class UserModule {}
