import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export enum WeekDay {
  MONDAY = 'MONDAY',
  TUESDAY = 'TUESDAY',
  WEDNESDAY = 'WEDNESDAY',
  THURSDAY = 'THURSDAY',
  FRIDAY = 'FRIDAY',
  SATURDAY = 'SATURDAY',
  SUNDAY = 'SUNDAY',
}

export enum ResourceType {
  MEETING_ROOM = 'MEETING_ROOM',
  CONFERENCE_ROOM = 'CONFERENCE_ROOM',
  PRIVATE_ROOM = 'PRIVATE_ROOM',
  TRAINING_ROOM = 'TRAINIG_ROOM',
}

@Schema({ _id: false })
export class OperatingHours {
  @Prop({
    type: String,
    enum: WeekDay,
    required: true,
  })
  day: WeekDay;

  @Prop({
    type: Boolean,
    default: true,
    required: true,
  })
  isOpen: boolean;

  @Prop({ type: String })
  openTime?: string;

  @Prop({ type: String })
  closeTime?: string;

  @Prop({ type: Number, default: 0, select: false })
  reservationLockVersion: number;
}

export const OperatingHoursSchema =
  SchemaFactory.createForClass(OperatingHours);

export type ResourceDocument = HydratedDocument<Resource>;

@Schema({ timestamps: true })
export class Resource {
  @Prop({
    required: true,
    trim: true,
  })
  name: string;

  @Prop({
    trim: true,
    default: '',
  })
  description: string;

  @Prop({
    required: true,
    enum: ResourceType,
    trim: true,
  })
  type: ResourceType;

  @Prop({
    required: true,
    min: 1,
    validate: {
      validator: Number.isInteger,
      message: 'Capacity must be an integer',
    },
  })
  capacity: number;

  @Prop({
    required: true,
    trim: true,
  })
  location: string;

  @Prop({
    type: [OperatingHoursSchema],
    default: [],
  })
  operatingHours: OperatingHours[];

  @Prop({
    type: Boolean,
    default: true,
    required: true,
  })
  isActive: boolean;

  @Prop({
    type: Date,
    default: null,
  })
  deletedAt: Date | null;
}

export const ResourceSchema = SchemaFactory.createForClass(Resource);
