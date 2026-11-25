import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
} from '@nestjs/common';

import { ReservationsService } from './reservation-service.js';

import { CreateReservationDto } from './dto/create-reservation.dto.js';
import { ReservationQueryDto } from './dto/query-reservations.dto.js';
import { UpdateReservationDto } from './dto/update-reservation.dto.js';
import { CheckAvailabilityDto } from './dto/check-availability.dto.js';

import { UserRole } from '../users/schemas/user.shema.js';

import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';
import { Roles } from '../auth/decrotaors/roles.decorator.js';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
interface AuthenticatedRequest {
  user: {
    sub: string;
    role: UserRole;
  };
}

@ApiTags('Reservations')
@ApiBearerAuth()
@Controller('reservations')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ReservationsController {
  constructor(private readonly reservationsService: ReservationsService) {}

  @Post()
  @Roles(UserRole.ADMIN)
  createReservation(
    @Req() req: AuthenticatedRequest,
    @Body() dto: CreateReservationDto,
  ) {
    return this.reservationsService.createReservation(req.user.sub, dto);
  }

  @Get('me')
  @Roles(UserRole.CUSTOMER)
  getMyReservations(
    @Req() req: AuthenticatedRequest,
    @Query() query: ReservationQueryDto,
  ) {
    return this.reservationsService.getMyReservations(req.user.sub, query);
  }

  @Post('availability')
  @Roles(UserRole.ADMIN, UserRole.ADMIN)
  checkResourceAvailability(@Body() dto: CheckAvailabilityDto) {
    return this.reservationsService.checkResourceAvailability(dto);
  }

  @Get()
  @Roles(UserRole.ADMIN)
  getAllReservations(@Query() query: ReservationQueryDto) {
    return this.reservationsService.getAllReservations(query);
  }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.CUSTOMER)
  getReservationById(
    @Param('id') id: string,
    @Req() req: AuthenticatedRequest,
  ) {
    const userId = req.user.role === UserRole.ADMIN ? undefined : req.user.sub;

    return this.reservationsService.getReservationById(id, userId);
  }

  @Patch(':id')
  @Roles(UserRole.CUSTOMER)
  updateReservation(
    @Param('id') id: string,
    @Req() req: AuthenticatedRequest,
    @Body() dto: UpdateReservationDto,
  ) {
    return this.reservationsService.updateReservation(id, req.user.sub, dto);
  }

  @Patch(':id/cancel')
  @Roles(UserRole.CUSTOMER)
  cancelReservation(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    if (req.user.role === UserRole.ADMIN) {
      return this.reservationsService.adminCancelReservation(id);
    }

    return this.reservationsService.cancelMyReservation(id, req.user.sub);
  }

  @Patch(':id/confirm')
  @Roles(UserRole.CUSTOMER)
  confirmReservation(@Param('id') id: string) {
    return this.reservationsService.confirmReservation(id);
  }
}
