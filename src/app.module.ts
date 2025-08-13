import { Module } from '@nestjs/common';
import { UserModule } from './user/user.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { SequelizeModule } from '@nestjs/sequelize';
import { KondoModule } from './kondo/kondo.module';
import { AppController } from './app.controller';
import { IntegratorModule } from './integrator/integrator.module';
import { kondoProviders } from './kondo/repository/kondo.provider';
import { Dialect } from 'sequelize';
import { Kondo } from './kondo/entities/kondo.entity';
import { Media } from './media/entities/media.entity';
import { MediaModule } from './media/media.module';
import { User } from './user/entities/user.entity';
import { UnitModule } from './unit/unit.module';
import { Unit } from './unit/entities/unit.entity';
import { LikeModule } from './like/like.module';
import { Like } from './like/entities/like.entity';
import { AuthModule } from './auth/auth.module';
import { GoogleStrategy } from './auth/strategies/google.strategy';
import { WhatsappModule } from './whatsapp/whatsapp.module';
import { RealEstateAgency } from './whatsapp/entities/real-estate-agency.entity';
import { Conversation } from './whatsapp/entities/conversation.entity';
import { Message } from './whatsapp/entities/message.entity';
// Environment configuration is handled by ConfigModule

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    SequelizeModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const nodeEnv = configService.get<string>('NODE_ENV');
        const requiresSsl = nodeEnv === 'PRODUCTION';
        return {
          dialect: (configService.get<string>('DB_DIALECT') || 'postgres') as Dialect,
          dialectOptions: requiresSsl ? { ssl: { require: true, rejectUnauthorized: false } } : {},
          host: configService.get<string>('DB_HOST') || 'localhost',
          port: parseInt(configService.get<string>('DB_PORT') || '5433', 10),
          username: configService.get<string>('DB_USER') || 'postgres',
          password: configService.get<string>('DB_PASSWORD') || 'postgres',
          database: configService.get<string>('DB_NAME') || 'kondo',
          models: [User, Kondo, Media, Unit, Like, RealEstateAgency, Conversation, Message],
          autoLoadModels: true,
          logging: (msg: string) => console.log('🐘 DB Query:', msg),
          logQueryParameters: true,
          synchronize: false,
        };
      },
    }),
    UserModule, 
    KondoModule,
    IntegratorModule,
    MediaModule,
    UnitModule,
    LikeModule,
    AuthModule,
    WhatsappModule
  //   SeederModule.forRoot({
  //     // Activate this if you want to run the seeders if the table is empty in the database
  //     runOnlyIfTableIsEmpty: true,
  //     logging: true,
  //  }),
    //SequelizeModule.forFeature([User, Kondo])
  ],
  controllers: [AppController],
  providers: [...kondoProviders, GoogleStrategy],
})


export class AppModule {}
