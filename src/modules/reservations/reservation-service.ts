import {
  BadRequestException,
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';

import { InjectModel, InjectConnection } from '@nestjs/mongoose';
import type {Model, QueryFilter, ClientSession, Connection } from 'mongoose';
import {Types} from "mongoose";

import {
  Reservation,
  ReservationDocument,
  ReservationStatus,
} from './schemas/reservation.schema.js';

import { Resource } from '../resources/schemas/resource.schema.js';

import { CreateReservationDto } from './dto/create-reservation.dto.js';

import { ReservationQueryDto } from './dto/query-reservations.dto.js';

import { UpdateReservationDto } from './dto/update-reservation.dto.js';

import { CheckAvailabilityDto } from './dto/check-availability.dto.js';

const PENDING_RESERVATION_LEASE_MS = 10 * 60 * 1000;

@Injectable()
export class ReservationsService {
  constructor(
    @InjectModel(Reservation.name)
    private reservationModel: Model<Reservation>,

    @InjectModel(Resource.name)
    private resourceModel: Model<Resource>,

    @InjectConnection()
    private connection: Connection,
  ) {}

  async createReservation(userId: string, dto: CreateReservationDto) {
    const { resourceId, startAt, endAt, guestCount } = dto;

    const startDate = new Date(startAt);
    const endDate = new Date(endAt);

    if (endDate <= startDate) {
      throw new BadRequestException('End date must be after start date');
    }

    if (startDate <= new Date()) {
      throw new BadRequestException('Reservation must start in the future');
    }

    const session = await this.connection.startSession();

    try {
      return await session.withTransaction(async () => {
        const lockResult = await this.resourceModel.updateOne(
          {
            _id: resourceId,
            isActive: true,
            deletedAt: null,
          },
          {
            $inc: { reservationLockVersion: 1 },
          },
          { session },
        );

        if (lockResult.matchedCount === 0) {
          throw new NotFoundException('Resource not found');
        }

        const resource = await this.resourceModel
          .findById(resourceId)
          .session(session);

        if (!resource) {
          throw new NotFoundException('Resource not found');
        }

        if (guestCount > resource.capacity) {
          throw new BadRequestException(
            'Guest count exceeds resource capacity',
          );
        }

        const isWithinOperatingHours = this.validateOperatingHours(
          startDate,
          endDate,
          resource.operatingHours,
        );

        if (!isWithinOperatingHours) {
          throw new BadRequestException(
            'Requested time is outside resource operating hours',
          );
        }

        await this.checkCapacityAvailability(
          resourceId,
          startDate,
          endDate,
          guestCount,
          resource.capacity,
          undefined,
          session,
        );

        const expiresAt = new Date(Date.now() + PENDING_RESERVATION_LEASE_MS);

        const [reservation] = await this.reservationModel.create(
          [
            {
              userId: new Types.ObjectId(userId),
              resourceId: new Types.ObjectId(resourceId),
              startAt: startDate,
              endAt: endDate,
              guestCount,
              status: ReservationStatus.PENDING,
              expiresAt,
            },
          ],
          { session },
        );

        return reservation;
      });
    } finally {
      await session.endSession();
    }
  }

  private getWeekDay(date: Date): string {
    const days = [
      'SUNDAY',
      'MONDAY',
      'TUESDAY',
      'WEDNESDAY',
      'THURSDAY',
      'FRIDAY',
      'SATURDAY',
    ];

    return days[date.getDay()];
  }

  private getTimeInMinutes(date: Date): number {
    return date.getHours() * 60 + date.getMinutes();
  }

  private validateOperatingHours(
    startDate: Date,
    endDate: Date,
    operatingHours: Resource['operatingHours'],
  ): boolean {
    let currentDate = new Date(startDate);

    while (currentDate < endDate) {
      const dayStart = new Date(currentDate);
      dayStart.setHours(0, 0, 0, 0);

      const nextDay = new Date(dayStart);
      nextDay.setDate(nextDay.getDate() + 1);

      const segmentStart = new Date(
        Math.max(startDate.getTime(), dayStart.getTime()),
      );

      const segmentEnd = new Date(
        Math.min(endDate.getTime(), nextDay.getTime()),
      );

      const dayHours = operatingHours.find(
        (hours) => hours.day === this.getWeekDay(currentDate),
      );

      if (
        !dayHours ||
        !dayHours.isOpen ||
        !dayHours.openTime ||
        !dayHours.closeTime
      ) {
        return false;
      }

      const openingTime = new Date(dayStart);
      const [openHour, openMinute] = dayHours.openTime.split(':').map(Number);
      openingTime.setHours(openHour, openMinute, 0, 0);

      const closingTime = new Date(dayStart);
      const [closeHour, closeMinute] = dayHours.closeTime
        .split(':')
        .map(Number);
      closingTime.setHours(closeHour, closeMinute, 0, 0);

      if (segmentStart < openingTime || segmentEnd > closingTime) {
        return false;
      }

      currentDate = nextDay;
    }

    return true;
  }

  private async checkCapacityAvailability(
    resourceId: string,
    startDate: Date,
    endDate: Date,
    guestCount: number,
    capacity: number,
    excludeReservationId?: string,
    session?: ClientSession,
  ) {
    const filter = {
      resourceId,
      startAt: { $lt: endDate },
      endAt: { $gt: startDate },
      $or: [
        { status: ReservationStatus.CONFIRMED },
        {
          status: ReservationStatus.PENDING,
          expiresAt: { $gt: new Date() },
        },
      ],
      ...(excludeReservationId && {
        _id: { $ne: new Types.ObjectId(excludeReservationId) },
      }),
    } as QueryFilter<Reservation>;

    const overlappingReservations = await this.reservationModel
      .find(filter)
      .select('startAt endAt guestCount')
      .session(session ?? null);

    const events: {
      time: number;
      guests: number;
    }[] = [];

    // Add the new reservation
    events.push(
      { time: startDate.getTime(), guests: guestCount },
      { time: endDate.getTime(), guests: -guestCount },
    );

    // Add existing overlapping reservations
    for (const reservation of overlappingReservations) {
      events.push(
        {
          time: Math.max(reservation.startAt.getTime(), startDate.getTime()),
          guests: reservation.guestCount,
        },
        {
          time: Math.min(reservation.endAt.getTime(), endDate.getTime()),
          guests: -reservation.guestCount,
        },
      );
    }

    // Sort by time.
    // When times are equal, process ending reservations first.
    events.sort((a, b) => {
      if (a.time !== b.time) {
        return a.time - b.time;
      }

      return a.guests - b.guests;
    });

    let currentOccupancy = 0;

    for (const event of events) {
      currentOccupancy += event.guests;

      if (currentOccupancy > capacity) {
        throw new ConflictException(
          'Resource capacity is not available for this time slot',
        );
      }
    }
  }

  private buildReservationFilter(
    query: ReservationQueryDto,
  ): QueryFilter<Reservation> {
    const { status, from, to } = query;

    const filter: QueryFilter<Reservation> = {};

    if (status) {
      filter.status = status;
    }

    if (from && to && new Date(from) >= new Date(to)) {
      throw new BadRequestException(
        'The "from" date must be before the "to" date',
      );
    }

    if (to) {
      filter.startAt = { $lt: new Date(to) };
    }

    if (from) {
      filter.endAt = { $gt: new Date(from) };
    }

    return filter;
  }

  async getMyReservations(userId: string, query: ReservationQueryDto) {
    const filter = this.buildReservationFilter(query);

    const reservations = await this.reservationModel
      .find({
        ...filter,
        userId,
      } as QueryFilter<Reservation>)
      .sort({ createdAt: -1 });

    return reservations;
  }

  async getReservationById(reservationId: string, userId?: string) {
    const filter: QueryFilter<Reservation> = {
      _id: reservationId,
    };

    if (userId) {
      filter.userId = userId;
    }

    const reservation = await this.reservationModel.findOne(filter);

    if (!reservation) {
      throw new NotFoundException('Reservation not found');
    }

    return reservation;
  }

  async getAllReservations(query: ReservationQueryDto) {
    const filter = this.buildReservationFilter(query);

    return this.reservationModel.find(filter).sort({ createdAt: -1 });
  }

  async updateReservation(
    reservationId: string,
    userId: string,
    updateDto: UpdateReservationDto,
  ) {
    if (Object.keys(updateDto).length === 0) {
      throw new BadRequestException('No update data provided');
    }

    const session = await this.connection.startSession();

    try {
      return await session.withTransaction(async () => {
        // 1. Find the reservation inside the transaction
        const reservation = await this.reservationModel
          .findOne({ _id: reservationId, userId })
          .session(session);

        if (!reservation) {
          throw new NotFoundException('Reservation not found');
        }

        if (
          ![ReservationStatus.PENDING, ReservationStatus.CONFIRMED].includes(
            reservation.status,
          )
        ) {
          throw new BadRequestException('This reservation cannot be updated');
        }

        if (
          reservation.status === ReservationStatus.PENDING &&
          (!reservation.expiresAt || reservation.expiresAt <= new Date())
        ) {
          throw new BadRequestException('Reservation lease has expired');
        }

        // 2. Determine the new reservation values
        const newResourceId =
          updateDto.resourceId ?? reservation.resourceId.toString();

        const startDate = updateDto.startAt
          ? new Date(updateDto.startAt)
          : reservation.startAt;

        const endDate = updateDto.endAt
          ? new Date(updateDto.endAt)
          : reservation.endAt;

        const guestCount = updateDto.guestCount ?? reservation.guestCount;

        if (endDate <= startDate) {
          throw new BadRequestException('End date must be after start date');
        }

        if (startDate <= new Date()) {
          throw new BadRequestException('Reservation must start in the future');
        }

        // 3. Lock the old and new resources in a consistent order
        const resourceIds = [
          ...new Set([reservation.resourceId.toString(), newResourceId]),
        ].sort();

        for (const id of resourceIds) {
          const lockResult = await this.resourceModel.updateOne(
            { _id: id },
            { $inc: { reservationLockVersion: 1 } },
            { session },
          );

          if (lockResult.matchedCount === 0) {
            throw new NotFoundException('Resource not found');
          }
        }

        // 4. Get the target resource
        const resource = await this.resourceModel
          .findOne({
            _id: newResourceId,
            isActive: true,
            deletedAt: null,
          })
          .session(session);

        if (!resource) {
          throw new NotFoundException('Resource not found');
        }

        if (guestCount > resource.capacity) {
          throw new BadRequestException(
            'Guest count exceeds resource capacity',
          );
        }

        // 5. Validate operating hours
        const isWithinOperatingHours = this.validateOperatingHours(
          startDate,
          endDate,
          resource.operatingHours,
        );

        if (!isWithinOperatingHours) {
          throw new BadRequestException(
            'Requested time is outside resource operating hours',
          );
        }

        // 6. Check capacity, excluding the current reservation
        await this.checkCapacityAvailability(
          newResourceId,
          startDate,
          endDate,
          guestCount,
          resource.capacity,
          reservationId,
          session,
        );

        // 7. Update the reservation
        reservation.resourceId = new Types.ObjectId(newResourceId);
        reservation.startAt = startDate;
        reservation.endAt = endDate;
        reservation.guestCount = guestCount;

        return reservation.save({ session });
      });
    } finally {
      await session.endSession();
    }
  }

  async cancelMyReservation(reservationId: string, userId: string) {
    const reservation = await this.reservationModel.findOne({
      _id: reservationId,
      userId,
    });

    if (!reservation) {
      throw new NotFoundException('Reservation not found');
    }

    return this.cancelReservation(reservation);
  }

  async adminCancelReservation(reservationId: string) {
    const reservation = await this.reservationModel.findById(reservationId);

    if (!reservation) {
      throw new NotFoundException('Reservation not found');
    }

    return this.cancelReservation(reservation);
  }

  private async cancelReservation(reservation: ReservationDocument) {
    if (
      ![ReservationStatus.PENDING, ReservationStatus.CONFIRMED].includes(
        reservation.status,
      )
    ) {
      throw new BadRequestException('This reservation cannot be cancelled');
    }

    reservation.status = ReservationStatus.CANCELLED;
    reservation.cancelledAt = new Date();

    return reservation.save();
  }

  async checkResourceAvailability(dto: CheckAvailabilityDto) {
    const { resourceId, startAt, endAt, guestCount } = dto;

    const startDate = new Date(startAt);
    const endDate = new Date(endAt);

    if (startDate >= endDate) {
      throw new BadRequestException('End date must be after start date');
    }

    if (startDate <= new Date()) {
      throw new BadRequestException('Reservation must start in the future');
    }

    const resource = await this.resourceModel.findOne({
      _id: resourceId,
      isActive: true,
      deletedAt: null,
    });

    if (!resource) {
      throw new NotFoundException('Resource not found or unavailable');
    }

    if (guestCount > resource.capacity) {
      return {
        available: false,
        message: 'Guest count exceeds resource capacity',
      };
    }

    const isWithinOperatingHours = this.validateOperatingHours(
      startDate,
      endDate,
      resource.operatingHours,
    );

    if (!isWithinOperatingHours) {
      return {
        available: false,
        message: 'Requested time is outside resource operating hours',
      };
    }

    try {
      await this.checkCapacityAvailability(
        resourceId,
        startDate,
        endDate,
        guestCount,
        resource.capacity,
      );

      return {
        available: true,
        message: 'Resource is available',
      };
    } catch (error) {
      if (error instanceof ConflictException) {
        return {
          available: false,
          message: 'Resource capacity is not available',
        };
      }

      throw error;
    }
  }

  async confirmReservation(reservationId: string) {
    const session = await this.connection.startSession();

    try {
      return await session.withTransaction(async () => {
        const reservation = await this.reservationModel
          .findById(reservationId)
          .session(session);

        if (!reservation) {
          throw new NotFoundException('Reservation not found');
        }

        await this.resourceModel.updateOne(
          { _id: reservation.resourceId },
          { $inc: { reservationLockVersion: 1 } },
          { session },
        );

        if (reservation.status !== ReservationStatus.PENDING) {
          throw new BadRequestException(
            'Only pending reservations can be confirmed',
          );
        }

        if (!reservation.expiresAt || reservation.expiresAt <= new Date()) {
          throw new BadRequestException('Reservation lease has expired');
        }

        reservation.status = ReservationStatus.CONFIRMED;
        reservation.confirmedAt = new Date();

        return reservation.save({ session });
      });
    } finally {
      await session.endSession();
    }
  }
}
