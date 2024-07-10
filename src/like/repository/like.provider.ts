import { LIKE_REPOSITORY_PROVIDER } from '../../core/constants'
import { Like } from '../entities/like.entity';

export const likeProviders = [{
    provide: LIKE_REPOSITORY_PROVIDER,
    useValue: Like,
}];
