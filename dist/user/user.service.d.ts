import { UserDto } from './dto/user.dto';
import { User } from './entities/user.entity';
import { UpdateUserDto } from './dto/update-user.dto';
export declare class UserService {
    private readonly userRepository;
    constructor(userRepository: typeof User);
    create(user: UserDto): Promise<User>;
    findOneByEmail(email: string): Promise<User>;
    findOne(id: number): Promise<User>;
    findActives(): Promise<User[]>;
    findAll(): Promise<User[]>;
    update(id: number, user: UpdateUserDto): Promise<User>;
    deactivateUser(id: number): Promise<User>;
}
