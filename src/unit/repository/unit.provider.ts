import { UNIT_REPOSITORY_PROVIDER } from '../../core/constants'
import { Unit } from '../entities/unit.entity';

export const unitProviders = [{
    provide: UNIT_REPOSITORY_PROVIDER,
    useValue: Unit,
}];
