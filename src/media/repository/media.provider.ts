import { MEDIA_REPOSITORY_PROVIDER } from '../../core/constants'
import { Media } from '../entities/media.entity';

export const mediaProviders = [{
    provide: MEDIA_REPOSITORY_PROVIDER,
    useValue: Media,
}];
