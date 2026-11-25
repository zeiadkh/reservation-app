
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

interface AuthenticatedRequest {
  user: {
    sub: string;
    role: UserRole;
  };
}

@Controller('reservations')
export class ReservationsController {
  constructor(
    private readonly reservationsService: ReservationsService,
  ) {}

  @Post()
  createReservation(
    @Req() req: AuthenticatedRequest,
    @Body() dto: CreateReservationDto,
  ) {
    return this.reservationsService.createReservation(
      req.user.sub,
      dto,
    );
  }

  @Get('me')
  getMyReservations(
    @Req() req: AuthenticatedRequest,
    @Query() query: ReservationQueryDto,
  ) {
    return this.reservationsService.getMyReservations(
      req.user.sub,
      query,
    );
  }

  @Post('availability')
  checkResourceAvailability(
    @Body() dto: CheckAvailabilityDto,
  ) {
    return this.reservationsService.checkResourceAvailability(dto);
  }

  @Get()
  getAllReservations(
    @Query() query: ReservationQueryDto,
  ) {
    return this.reservationsService.getAllReservations(query);
  }

  @Get(':id')
  getReservationById(
    @Param('id') id: string,
    @Req() req: AuthenticatedRequest,
  ) {
    const userId =
      req.user.role === UserRole.ADMIN
        ? undefined
        : req.user.sub;

    return this.reservationsService.getReservationById(
      id,
      userId,
    );
  }

  @Patch(':id')
  updateReservation(
    @Param('id') id: string,
    @Req() req: AuthenticatedRequest,
    @Body() dto: UpdateReservationDto,
  ) {
    return this.reservationsService.updateReservation(
      id,
      req.user.sub,
      dto,
    );
  }

  @Patch(':id/cancel')
  cancelReservation(
    @Param('id') id: string,
    @Req() req: AuthenticatedRequest,
  ) {
    if (req.user.role === UserRole.ADMIN) {
      return this.reservationsService.adminCancelReservation(id);
    }

    return this.reservationsService.cancelMyReservation(
      id,
      req.user.sub,
    );
  }

  @Patch(':id/confirm')
  confirmReservation(
    @Param('id') id: string,
  ) {
    return this.reservationsService.confirmReservation(id);
  }
}
