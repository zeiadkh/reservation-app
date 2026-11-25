import { Module } from '@nestjs/common';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { MongooseModule  } from '@nestjs/mongoose';
import { ConfigModule, ConfigService } from '@nestjs/config';
import {User, UserSchema} from "./modules/users/schemas/user.shema.js"
import { UserSession, UserSessionSchema } from './modules/sessions/schemas/user.session.schema.js';
import { UsersModule } from './modules/users/users.module.js';
import { SessionsModule } from './modules/sessions/sessions.module.js';
import { ResourcesModule } from './modules/resources/resources.module.js';
import { ReservationModule } from './modules/reservations/reservation.module.js';
import { AuthModule } from './modules/auth/auth.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (config: ConfigService) => ({
        uri: config.get<string>('MONGODB_URI'), 
      }),
    }),
    MongooseModule.forFeature([{name: User.name, schema: UserSchema}, {name: UserSession.name, schema: UserSessionSchema}]),
    UsersModule,
    SessionsModule,
    ResourcesModule,
    ReservationModule,
    AuthModule
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
