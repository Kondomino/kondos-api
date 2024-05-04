import { USER_REPOSITORY_PROVIDER } from '../../core/constants'
import { User } from '../entities/user.entity';

export const userProviders = [{
    provide: USER_REPOSITORY_PROVIDER,
    useValue: User,
}];
