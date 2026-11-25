import { MongooseModule, Schema } from '@nestjs/mongoose';
import { Module } from '@nestjs/common';
import { Reservation, ReservationSchema } from './schemas/reservation.schema.js';
import { Resource, ResourceSchema } from '../resources/schemas/resource.schema.js';
@Module({
    imports: [MongooseModule.forFeature([{name: Reservation.name, schema: ReservationSchema}, {name: Resource.name, schema: ResourceSchema}])],
    exports: [MongooseModule]
})
export class ReservationModule {}
