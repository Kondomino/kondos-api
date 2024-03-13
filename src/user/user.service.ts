import { Injectable, Inject } from '@nestjs/common';
import { UserDto } from './dto/user.dto';
import { USER_REPOSITORY } from 'src/core/constants';
import { User } from './entities/user.entity';

@Injectable()
export class UserService {

    constructor(@Inject(USER_REPOSITORY) private readonly userRepository: typeof User) { }

    async create(user: UserDto): Promise<User> {
        return await this.userRepository.create<User>(user);
    }

    async findOneByEmail(email: string): Promise<User> {
        return await this.userRepository.findOne<User>({ where: { email } });
    }

    async findOne(id: number): Promise<User> {
        return await this.userRepository.findOne<User>({ where: { id } });
    }
    async findAll(): Promise<User[]> {
        return await this.userRepository.findAll<User>({});
    }
}