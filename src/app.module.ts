import { Module } from '@nestjs/common';
import { UserModule } from './user/user.module';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from './modules/database/database.module';
import { KondoModule } from './kondo/kondo.module';
import { AppController } from './app.controller';
import { IntegratorModule } from './integrator/integrator.module';
import { kondoProviders } from './kondo/repository/kondo.provider';
import { MediaModule } from './media/media.module';
import { UnitModule } from './unit/unit.module';
import { LikeModule } from './like/like.module';
import { AuthModule } from './auth/auth.module';
import { WhatsappModule } from './whatsapp/whatsapp.module';
// Environment configuration is handled by ConfigModule

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    DatabaseModule,
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
  providers: [...kondoProviders],
})


export class AppModule {}
