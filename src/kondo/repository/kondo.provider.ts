import { KONDO_REPOSITORY_PROVIDER } from '../../core/constants'
import { Kondo } from '../entities/Kondo.entity';

export const kondoProviders = [{
    provide: KONDO_REPOSITORY_PROVIDER,
    useValue: Kondo,
}];
