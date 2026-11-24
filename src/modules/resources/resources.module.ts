import { Module } from '@nestjs/common';
import { MongooseModule, Schema } from '@nestjs/mongoose';
import { Resource, ResourceSchema } from './schemas/resource.schema.js';
@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Resource.name, schema: ResourceSchema },
    ]),
  ],
  exports: [MongooseModule],
})
export class ResourcesModule {}
