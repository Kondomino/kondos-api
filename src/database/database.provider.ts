import { Sequelize } from 'sequelize-typescript';
import { SEQUELIZE, DEVELOPMENT, TEST, PRODUCTION } from '../core/constants';
import { databaseConfig } from './database.config';
import { User } from '../user/entities/user.entity';
import { Kondo } from '../kondo/entities/kondo.entity';
import { Media } from '../media/entities/media.entity';
import { Unit } from '../unit/entities/unit.entity';
import { Like } from '../like/entities/like.entity';

export const databaseProviders = [{
    provide: SEQUELIZE,
    useFactory: async () => {
        let config;
        switch (process.env.NODE_ENV) {
            case DEVELOPMENT:
                config = databaseConfig.development;
                break;
            case TEST:
                config = databaseConfig.test;
                break;
            case PRODUCTION:
                config = databaseConfig.production;
                break;
            default:
                config = databaseConfig.development;
        }
        const sequelize = new Sequelize(config);
        sequelize.addModels([User, Kondo, Media, Unit, Like]);
        await sequelize.sync();
        return sequelize;
    },
}];