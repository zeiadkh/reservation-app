import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { Resource, ResourceSchema } from './schemas/resource.schema.js';
import { ResourcesController } from './resources-controller.js';
import { ResourcesService } from './resources-service.js';

import { AuthModule } from '../auth/auth.module.js';
import { User, UserSchema } from '../users/schemas/user.shema.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Resource.name, schema: ResourceSchema },
      { name: User.name, schema: UserSchema },
    ]),
    AuthModule,
  ],
  controllers: [ResourcesController],
  providers: [ResourcesService, JwtAuthGuard, RolesGuard],
  exports: [ResourcesService],
})
export class ResourcesModule {}