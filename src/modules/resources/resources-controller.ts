import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
  Req
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { ResourcesService } from './resources-service.js';
import { CreateResourceDto } from './dto/create-resource.dto.js';
import { UpdateResourceDto } from './dto/update-resource.dto.js';
import { ResourceQueryDto } from './dto/query-resources.dto.js';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';
import { Roles } from '../auth/decrotaors/roles.decorator.js';
import { UserRole } from '../users/schemas/user.shema.js';

@ApiTags('Resources')
@ApiBearerAuth()
@Controller('resources')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ResourcesController {
  constructor(private readonly resourcesService: ResourcesService) {}

  @Post()
  @Roles(UserRole.ADMIN)
  create(@Body() dto: CreateResourceDto) {
    return this.resourcesService.create(dto);
  }

  @Get()
  @Roles(UserRole.ADMIN, UserRole.CUSTOMER)
  findAll(
  @Query() query: ResourceQueryDto,
  @Req() req: { user: { role: UserRole } },
) {
  return this.resourcesService.findAll(query, req.user.role);
}

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.CUSTOMER)
  findOne(@Param('id') id: string) {
    return this.resourcesService.findOne(id);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN)
  update(
    @Param('id') id: string,
    @Body() dto: UpdateResourceDto,
  ) {
    return this.resourcesService.update(id, dto);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  remove(@Param('id') id: string) {
    return this.resourcesService.remove(id);
  }
}