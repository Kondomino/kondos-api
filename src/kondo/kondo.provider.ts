import { KONDO_REPOSITORY } from '../core/constants'
import { Kondo } from './entities/kondo.entity';

export const kondoProviders = [{
    provide: KONDO_REPOSITORY,
    useValue: Kondo,
}];
