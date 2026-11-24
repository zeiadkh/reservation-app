import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  UserSession,
  UserSessionSchema,
} from './schemas/user.session.schema.js';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: UserSession.name, schema: UserSessionSchema },
    ]),
  ],
  exports: [MongooseModule],
})
export class SessionsModule {}