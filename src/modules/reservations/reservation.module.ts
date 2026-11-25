import { MongooseModule, Schema } from '@nestjs/mongoose';
import { Module } from '@nestjs/common';
import {
  Reservation,
  ReservationSchema,
} from './schemas/reservation.schema.js';
import {
  Resource,
  ResourceSchema,
} from '../resources/schemas/resource.schema.js';
import { ReservationsController } from './reservation-controller.js';
import { ReservationsService } from './reservation-service.js';
import { AuthModule } from '../auth/auth.module.js';
@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Reservation.name, schema: ReservationSchema },
      { name: Resource.name, schema: ResourceSchema },
    ]),
    AuthModule
  ],
  controllers: [ReservationsController],
  providers: [ReservationsService],
  exports: [MongooseModule],
})
export class ReservationModule {}
