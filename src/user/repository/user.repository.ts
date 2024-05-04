import { Injectable, Inject } from "@nestjs/common";
import { User } from "../entities/User.entity";
import { USER_REPOSITORY_PROVIDER } from "src/core/constants";
import { CreateUserDto } from "../dto/create-User.dto";
import { UpdateUserDto } from "../dto/update-User.dto";

type findOrCreateType = [User | null, Boolean];

@Injectable()
export class UserRepository {

    constructor(@Inject(USER_REPOSITORY_PROVIDER) private readonly UserRepositoryProvider: typeof User) { 
    }

    async find(): Promise<User[]> {
        return await this.UserRepositoryProvider.findAll<User>();
    }

    async findOne(): Promise<User> {
        return await this.UserRepositoryProvider.findOne<User>();
    }

    async findAll(): Promise<User[]> {
        return await this.UserRepositoryProvider.findAll<User>();
    }

    /**
     * Find or Create
     * 
     * @param findOrCreate 
     *      Will try to find by id or slug.
     *      If nothing is found, will create.
     * @returns 
     */
    async findOrCreate(findOrCreate: { where: { id?: Number, slug?: string }, defaults: CreateUserDto}): Promise<findOrCreateType> {
        return await this.UserRepositoryProvider.findOrCreate<User>(findOrCreate);    
    }

    /**
     * Update 
     * 
     * @param updateUserDto 
     * @param where {
                        where: {
                        lastName: null,
                        },
                    },
     * @returns 
     */
    async update(updateUserDto: UpdateUserDto, where): Promise<{}> {
        return await this.UserRepositoryProvider.update<User>(updateUserDto, { where });
    }

    async destroy(): Promise<Number> {
        return await this.UserRepositoryProvider.destroy<User>();
    }

    async create(createUserDto: CreateUserDto): Promise<User> {
        return await this.UserRepositoryProvider.create<User>(createUserDto);
    }

}