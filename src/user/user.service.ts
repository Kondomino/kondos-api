import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { UserDto } from './dto/user.dto';
import { USER_REPOSITORY } from 'src/core/constants';
import { User } from './entities/user.entity';
import { UpdateUserDto } from './dto/update-user.dto';

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
    async findActives(): Promise<User[]> {
        return await this.userRepository.findAll<User>({ where: { active: true }});
    }
    async findAll(): Promise<User[]> {
        return await this.userRepository.findAll<User>({});
    }

    async update(id: number, user: UpdateUserDto): Promise<User> {
        const userFound = await this.findOne(id);

        if (!userFound)
            throw new NotFoundException();
        
        return await userFound.update({ ...user });
    }

    async deactivateUser(id: number): Promise<User> {
        const userFound = await this.findOne(id);

        if (!userFound)
            throw new NotFoundException();

        return await userFound.update({ active: false});
    }
}