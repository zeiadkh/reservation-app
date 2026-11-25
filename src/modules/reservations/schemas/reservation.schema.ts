
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import {
  HydratedDocument,
  Schema as MongooseSchema,
  Types
} from 'mongoose';

import { User } from '../../users/schemas/user.shema.js';
import { Resource } from '../../resources/schemas/resource.schema.js';

export enum ReservationStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  CANCELLED = 'CANCELLED',
  EXPIRED = 'EXPIRED',
  COMPLETED = 'COMPLETED',
}

export type ReservationDocument = HydratedDocument<Reservation>;

@Schema({ timestamps: true })
export class Reservation {
  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: User.name,
    required: true,
  })
  userId: Types.ObjectId;

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: Resource.name,
    required: true,
  })
  resourceId: Types.ObjectId;

  @Prop({
    type: Date,
    required: true,
  })
  startAt: Date;

  @Prop({
    type: Date,
    required: true,
  })
  endAt: Date;

  @Prop({
    type: Number,
    required: true,
    min: 1,
    validate: {
      validator: Number.isInteger,
      message: 'Guest count must be an integer',
    },
  })
  guestCount: number;

  @Prop({
    type: String,
    enum: ReservationStatus,
    default: ReservationStatus.PENDING,
    required: true,
  })
  status: ReservationStatus;

  @Prop({
    type: Date,
    default: null,
  })
  expiresAt: Date | null;

  @Prop({
    type: Date,
    default: null,
  })
  confirmedAt: Date | null;

  @Prop({
    type: Date,
    default: null,
  })
  cancelledAt: Date | null;
}

export const ReservationSchema =
  SchemaFactory.createForClass(Reservation);

// Resource availability queries
ReservationSchema.index({
  resourceId: 1,
  status: 1,
  startAt: 1,
  endAt: 1,
});

// Customer reservation history
ReservationSchema.index({
  userId: 1,
  createdAt: -1,
});

// Admin filtering
ReservationSchema.index({
  status: 1,
  startAt: 1,
});
