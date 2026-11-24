
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema } from 'mongoose';
import { User } from '../../users/schemas/user.shema.js';

export type UserSessionDocument = HydratedDocument<UserSession>;

@Schema({ timestamps: true, collection: 'user_sessions' })
export class UserSession {
  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: User.name,
    required: true,
  })
  userId: MongooseSchema.Types.ObjectId;

  @Prop({
    required: true,
    select: false,
  })
  refreshTokenHash: string;

  @Prop({
    required: true,
    index: true,
  })
  expiresAt: Date;

  @Prop({
    type: Date,
    default: null,
  })
  revokedAt: Date | null;

  @Prop()
  lastUsedAt?: Date;
}

export const UserSessionSchema =
  SchemaFactory.createForClass(UserSession);

UserSessionSchema.index({ userId: 1, revokedAt: 1 });
