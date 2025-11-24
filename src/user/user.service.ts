import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { UserDto } from './dto/user.dto';
import { USER_REPOSITORY_PROVIDER } from '../core/constants';
import { User } from './entities/user.entity';
import { UpdateUserDto } from './dto/update-user.dto';
import { findOrCreateType } from '../kondo/types/findorcreate.type';

@Injectable()
export class UserService {
    constructor(@Inject(USER_REPOSITORY_PROVIDER) private readonly userRepository: typeof User) { }

    async create(user: Partial<UserDto>): Promise<User> {
        return await this.userRepository.create<User>(user);
    }

    // async findOneByUsername(username: string): Promise<User | undefined> {
    //     return await this.userRepository.findOne<User>({ where: { username } });
    // }
    async findOneByEmail(email: string): Promise<User> {
        //console.log('searching by email ', email);
        return await this.userRepository.findOne<User>({ where: { email } });
    }
    async findOne(id: number): Promise<User> {
        //console.log('searching for', id);
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

    async findOrCreate(userDto: UserDto) : Promise<findOrCreateType> {
        return await this.userRepository.findOrCreate({
            where: { email: userDto.email },
            defaults: userDto
        });
    }
}