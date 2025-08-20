import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { SequelizeModule } from '@nestjs/sequelize';
import { databaseConfig } from '../../database/config';
import { User } from '../../user/entities/user.entity';
import { Kondo } from '../../kondo/entities/kondo.entity';
import { Media } from '../../media/entities/media.entity';
import { Unit } from '../../unit/entities/unit.entity';
import { Like } from '../../like/entities/like.entity';
import { RealEstateAgency } from '../../whatsapp/entities/real-estate-agency.entity';
import { Conversation } from '../../whatsapp/entities/conversation.entity';
import { Message } from '../../whatsapp/entities/message.entity';
import { MessageQueue } from '../../agentic/entities/message-queue.entity';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    SequelizeModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        ...databaseConfig(configService),
        models: [User, Kondo, Media, Unit, Like, RealEstateAgency, Conversation, Message, MessageQueue],
        autoLoadModels: true,
        synchronize: false, // Set to false to use migrations
        logging: (msg: string) => console.log('🐘 DB Query:', msg),
        logQueryParameters: true,
      }),
      inject: [ConfigService],
    }),
  ],
})
export class DatabaseModule {}
