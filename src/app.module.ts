import { Module } from '@nestjs/common';
import { UserModule } from './user/user.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { SequelizeModule } from '@nestjs/sequelize';
import { databaseConfig } from './database/config';
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
        const isProduction = nodeEnv === 'PRODUCTION';
        
        console.log(`🌍 Environment: ${nodeEnv}`);
        console.log(`🔗 Production mode: ${isProduction}`);
        console.log(`📦 Database config imported:`, !!databaseConfig);
        console.log(`📦 Database config keys:`, Object.keys(databaseConfig || {}));
        
        // Get the appropriate database configuration
        const environment = (nodeEnv || 'development').toLowerCase();
        const config = databaseConfig[environment];
        
        console.log(`🏠 Environment: ${environment}`);
        console.log(`🔧 Available configs:`, Object.keys(databaseConfig));
        
        if (!config) {
          throw new Error(`Database configuration not found for environment: ${environment}`);
        }
        
        console.log(`🔧 Database config:`, {
          host: config.host,
          port: config.port,
          database: config.database,
          dialect: config.dialect,
          hasUrl: !!config.url
        });
        
        // Ensure dialect is explicitly set for Sequelize v4+
        const sequelizeConfig = {
          ...config,
          dialect: config.dialect || 'postgres',
          models: [User, Kondo, Media, Unit, Like, RealEstateAgency, Conversation, Message],
          autoLoadModels: true,
          logging: (msg: string) => console.log('🐘 DB Query:', msg),
          logQueryParameters: true,
          synchronize: false,
        };
        
        return sequelizeConfig;
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
