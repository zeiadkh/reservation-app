import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
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
  ApiParam,
} from '@nestjs/swagger';

import { ReservationsService } from './reservation-service.js';

import { CreateReservationDto } from './dto/create-reservation.dto.js';
import { ReservationQueryDto } from './dto/query-reservations.dto.js';
import { UpdateReservationDto } from './dto/update-reservation.dto.js';
import { CheckAvailabilityDto } from './dto/check-availability.dto.js';

import { UserRole } from '../users/schemas/user.shema.js';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';
import { Roles } from '../auth/decrotaors/roles.decorator.js';

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
  @Roles(UserRole.CUSTOMER, UserRole.ADMIN)
  @ApiCreatedResponse({ description: 'Reservation created successfully.' })
  @ApiBadRequestResponse({ description: 'Invalid reservation data or booking rules violated.' })
  @ApiUnauthorizedResponse({ description: 'Authentication is required.' })
  @ApiForbiddenResponse({ description: 'User is not allowed to create this reservation.' })
  @ApiNotFoundResponse({ description: 'Resource not found.' })
  createReservation(
    @Req() req: AuthenticatedRequest,
    @Body() dto: CreateReservationDto,
  ) {
    return this.reservationsService.createReservation(req.user.sub, dto);
  }

  @Get('me')
  @Roles(UserRole.CUSTOMER)
  @ApiOperation({ summary: 'Get current customer reservations' })
  @ApiOkResponse({ description: 'Customer reservations retrieved successfully.' })
  @ApiUnauthorizedResponse({ description: 'Authentication is required.' })
  @ApiForbiddenResponse({ description: 'Only customers can access this endpoint.' })
  getMyReservations(
    @Req() req: AuthenticatedRequest,
    @Query() query: ReservationQueryDto,
  ) {
    return this.reservationsService.getMyReservations(req.user.sub, query);
  }

  @Post('availability')
  @Roles(UserRole.ADMIN, UserRole.CUSTOMER)
  @ApiOperation({ summary: 'Check resource availability' })
  @ApiOkResponse({ description: 'Availability check completed successfully.' })
  @ApiBadRequestResponse({ description: 'Invalid availability query.' })
  @ApiUnauthorizedResponse({ description: 'Authentication is required.' })
  @ApiForbiddenResponse({ description: 'User is not allowed to check availability.' })
  checkResourceAvailability(@Body() dto: CheckAvailabilityDto) {
    return this.reservationsService.checkResourceAvailability(dto);
  }

  @Get()
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Get all reservations (Admin only)' })
  @ApiOkResponse({ description: 'Reservations retrieved successfully.' })
  @ApiUnauthorizedResponse({ description: 'Authentication is required.' })
  @ApiForbiddenResponse({ description: 'Only admins can access all reservations.' })
  getAllReservations(@Query() query: ReservationQueryDto) {
    return this.reservationsService.getAllReservations(query);
  }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.CUSTOMER)
  @ApiOperation({ summary: 'Get reservation details by ID' })
  @ApiParam({ name: 'id', description: 'Reservation MongoDB ObjectId' })
  @ApiOkResponse({ description: 'Reservation retrieved successfully.' })
  @ApiBadRequestResponse({ description: 'Invalid reservation ID.' })
  @ApiUnauthorizedResponse({ description: 'Authentication is required.' })
  @ApiForbiddenResponse({ description: 'Customer cannot access another customer reservation.' })
  @ApiNotFoundResponse({ description: 'Reservation not found.' })
  getReservationById(
    @Param('id') id: string,
    @Req() req: AuthenticatedRequest,
  ) {
    const userId = req.user.role === UserRole.ADMIN ? undefined : req.user.sub;

    return this.reservationsService.getReservationById(id, userId);
  }

  @Patch(':id')
  @Roles(UserRole.CUSTOMER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Update a reservation' })
  @ApiParam({ name: 'id', description: 'Reservation MongoDB ObjectId' })
  @ApiOkResponse({ description: 'Reservation updated successfully.' })
  @ApiBadRequestResponse({ description: 'Invalid update data or booking rules violated.' })
  @ApiUnauthorizedResponse({ description: 'Authentication is required.' })
  @ApiForbiddenResponse({ description: 'Customer cannot update another customer reservation.' })
  @ApiNotFoundResponse({ description: 'Reservation or resource not found.' })
  updateReservation(
    @Param('id') id: string,
    @Req() req: AuthenticatedRequest,
    @Body() dto: UpdateReservationDto,
  ) {
    return this.reservationsService.updateReservation(
      id,
      req.user.sub,
      req.user.role,
      dto,
    );
  }

  @Patch(':id/cancel')
  @Roles(UserRole.CUSTOMER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Cancel a reservation' })
  @ApiParam({ name: 'id', description: 'Reservation MongoDB ObjectId' })
  @ApiOkResponse({ description: 'Reservation cancelled successfully.' })
  @ApiBadRequestResponse({ description: 'Reservation cannot be cancelled in its current state.' })
  @ApiUnauthorizedResponse({ description: 'Authentication is required.' })
  @ApiForbiddenResponse({ description: 'Customer cannot cancel another customer reservation.' })
  @ApiNotFoundResponse({ description: 'Reservation not found.' })
  cancelReservation(
    @Param('id') id: string,
    @Req() req: AuthenticatedRequest,
  ) {
    if (req.user.role === UserRole.ADMIN) {
      return this.reservationsService.adminCancelReservation(id);
    }

    return this.reservationsService.cancelMyReservation(id, req.user.sub);
  }

  @Patch(':id/confirm')
  @Roles(UserRole.CUSTOMER)
  @ApiOperation({ summary: 'Confirm a reservation (Admin only)' })
  @ApiParam({ name: 'id', description: 'Reservation MongoDB ObjectId' })
  @ApiOkResponse({ description: 'Reservation confirmed successfully.' })
  @ApiBadRequestResponse({ description: 'Reservation cannot be confirmed in its current state.' })
  @ApiUnauthorizedResponse({ description: 'Authentication is required.' })
  @ApiForbiddenResponse({ description: 'Only admins can confirm reservations.' })
  @ApiNotFoundResponse({ description: 'Reservation not found.' })
  confirmReservation(@Param('id') id: string) {
    return this.reservationsService.confirmReservation(id);
  }
}