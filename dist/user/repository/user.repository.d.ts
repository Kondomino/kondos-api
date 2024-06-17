import { User } from "../entities/User.entity";
import { CreateUserDto } from "../dto/create-User.dto";
import { UpdateUserDto } from "../dto/update-User.dto";
type findOrCreateType = [User | null, boolean];
export declare class UserRepository {
    private readonly UserRepositoryProvider;
    constructor(UserRepositoryProvider: typeof User);
    find(): Promise<User[]>;
    findOne(): Promise<User>;
    findAll(): Promise<User[]>;
    findOrCreate(findOrCreate: {
        where: {
            id?: number;
            slug?: string;
        };
        defaults: CreateUserDto;
    }): Promise<findOrCreateType>;
    update(updateUserDto: UpdateUserDto, where: any): Promise<object>;
    destroy(): Promise<number>;
    create(createUserDto: CreateUserDto): Promise<User>;
}
export {};
