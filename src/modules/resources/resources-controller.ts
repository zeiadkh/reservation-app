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
  Req,
} from '@nestjs/common';

import {
  ApiBearerAuth,
  ApiTags,
  ApiOperation,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiBadRequestResponse,
  ApiUnauthorizedResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiConflictResponse,
  ApiParam,
} from '@nestjs/swagger';

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
  @ApiOperation({ summary: '(Admin only)' })
  @ApiCreatedResponse({ description: 'Resource created successfully.' })
  @ApiBadRequestResponse({ description: 'Invalid resource data.' })
  @ApiUnauthorizedResponse({ description: 'Authentication is required.' })
  @ApiForbiddenResponse({ description: 'Only admins can create resources.' })
  @ApiConflictResponse({ description: 'A resource with conflicting data already exists.' })
  create(@Body() dto: CreateResourceDto) {
    return this.resourcesService.create(dto);
  }

  @Get()
  @Roles(UserRole.ADMIN, UserRole.CUSTOMER)
  @ApiOperation({
    description:
      'Customers can view active resources. Admins can view all resources.',
  })
  @ApiOkResponse({ description: 'Resources retrieved successfully.' })
  @ApiUnauthorizedResponse({ description: 'Authentication is required.' })
  @ApiForbiddenResponse({ description: 'The user role is not allowed to access this endpoint.' })
  findAll(
    @Query() query: ResourceQueryDto,
    @Req() req: { user: { role: UserRole } },
  ) {
    return this.resourcesService.findAll(query, req.user.role);
  }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.CUSTOMER)
  @ApiParam({ name: 'id', description: 'Resource MongoDB ObjectId' })
  @ApiOkResponse({ description: 'Resource retrieved successfully.' })
  @ApiBadRequestResponse({ description: 'Invalid resource ID.' })
  @ApiUnauthorizedResponse({ description: 'Authentication is required.' })
  @ApiNotFoundResponse({ description: 'Resource not found or inactive.' })
  findOne(@Param('id') id: string) {
    return this.resourcesService.findOne(id);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: '(Admin only)' })
  @ApiParam({ name: 'id', description: 'Resource MongoDB ObjectId' })
  @ApiOkResponse({ description: 'Resource updated successfully.' })
  @ApiBadRequestResponse({ description: 'Invalid resource ID or update data.' })
  @ApiUnauthorizedResponse({ description: 'Authentication is required.' })
  @ApiForbiddenResponse({ description: 'Only admins can update resources.' })
  @ApiNotFoundResponse({ description: 'Resource not found.' })
  @ApiConflictResponse({ description: 'The update conflicts with existing resource data.' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateResourceDto,
  ) {
    return this.resourcesService.update(id, dto);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: '(Admin only)' })
  @ApiParam({ name: 'id', description: 'Resource MongoDB ObjectId' })
  @ApiOkResponse({ description: 'Resource deleted successfully.' })
  @ApiBadRequestResponse({ description: 'Invalid resource ID.' })
  @ApiUnauthorizedResponse({ description: 'Authentication is required.' })
  @ApiForbiddenResponse({ description: 'Only admins can delete resources.' })
  @ApiNotFoundResponse({ description: 'Resource not found.' })
  remove(@Param('id') id: string) {
    return this.resourcesService.remove(id);
  }
}