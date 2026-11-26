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
import { User, UserSchema } from '../users/schemas/user.shema.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';
@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Reservation.name, schema: ReservationSchema },
      { name: Resource.name, schema: ResourceSchema },
      { name: User.name, schema: UserSchema },
    ]),
    AuthModule,
  ],
  controllers: [ReservationsController],
  providers: [
    ReservationsService,
    JwtAuthGuard,
    RolesGuard,
  ],
  exports: [MongooseModule],
})

export class ReservationModule {}
