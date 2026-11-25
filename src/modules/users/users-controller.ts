import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Req,
  UseGuards,
} from '@nestjs/common';

import { UsersService } from './users-service.js';
import { UpdateProfileDto } from './dto/update-profile.dto.js';
import { UpdateUserStatusDto } from './dto/update-user-status.dto.js';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';
import { Roles } from '../auth/decrotaors/roles.decorator.js';
import { UserRole } from './schemas/user.shema.js';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

@ApiTags('Users')
@ApiBearerAuth()
@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  @Roles(UserRole.CUSTOMER, UserRole.ADMIN)
  getMyProfile(@Req() req: { user: { sub: string } }) {
    return this.usersService.getMyProfile(req.user.sub);
  }

  @Patch('me')
  @Roles(UserRole.CUSTOMER, UserRole.ADMIN)
  updateMyProfile(
    @Req() req: { user: { sub: string } },
    @Body() dto: UpdateProfileDto,
  ) {
    return this.usersService.updateMyProfile(req.user.sub, dto);
  }

  @Get()
  @Roles(UserRole.ADMIN)
  findAll() {
    return this.usersService.findAll();
  }

  @Get(':id')
  @Roles(UserRole.ADMIN)
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  @Patch(':id/status')
  @Roles(UserRole.ADMIN)
  updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateUserStatusDto,
  ) {
    return this.usersService.updateStatus(id, dto.isActive);
  }
}