import { MongooseModule } from '@nestjs/mongoose';
import { Module } from '@nestjs/common';
import { Reservation, ReservationSchema } from './schemas/reservation.schema.js';

@Module({
    imports: [MongooseModule.forFeature([{name: Reservation.name, schema: ReservationSchema}])],
    exports: [MongooseModule]
})
export class ReservationModule {}
