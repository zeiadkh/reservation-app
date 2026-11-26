import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { InjectModel } from '@nestjs/mongoose';
import type { Model } from 'mongoose';

import { Resource, WeekDay } from './schemas/resource.schema.js';

import { CreateResourceDto } from './dto/create-resource.dto.js';
import { UpdateResourceDto } from './dto/update-resource.dto.js';
import { ResourceQueryDto } from './dto/query-resources.dto.js';
import { UserRole } from '../users/schemas/user.shema.js';

@Injectable()
export class ResourcesService {
  constructor(
    @InjectModel(Resource.name)
    private readonly resourceModel: Model<Resource>,
  ) {}

  private validateOperatingHours(
    operatingHours: CreateResourceDto['operatingHours'],
  ) {
    const days = new Set<WeekDay>();

    for (const hours of operatingHours) {
      if (days.has(hours.day)) {
        throw new BadRequestException(
          `Operating hours for ${hours.day} are duplicated`,
        );
      }

      days.add(hours.day);

      if (hours.isOpen) {
        if (!hours.openTime || !hours.closeTime) {
          throw new BadRequestException(
            `Opening and closing times are required for ${hours.day}`,
          );
        }

        if (hours.openTime >= hours.closeTime) {
          throw new BadRequestException(
            `Closing time must be after opening time for ${hours.day}`,
          );
        }
      }
    }
  }

  async create(dto: CreateResourceDto) {
    this.validateOperatingHours(dto.operatingHours);

    return this.resourceModel.create(dto);
  }

 async findAll(query: ResourceQueryDto, role: UserRole) {
  const filter: Record<string, unknown> = {
    deletedAt: null,
  };

  if (role === UserRole.CUSTOMER) {
    filter.isActive = true;
  } else if (query.isActive !== undefined) {
    filter.isActive = query.isActive === 'true';
  }

  if (query.type) filter.type = query.type;

  if (query.location) {
    filter.location = {
      $regex: query.location,
      $options: 'i',
    };
  }

  if (query.search) {
    filter.$or = [
      { name: { $regex: query.search, $options: 'i' } },
      { description: { $regex: query.search, $options: 'i' } },
    ];
  }

  return this.resourceModel.find(filter).sort({ createdAt: -1 });
}

  async findOne(id: string, role: UserRole) {
  const filter: any = { _id: id };

  if (role === UserRole.CUSTOMER) {
    filter.isActive = true;
  }

  const resource = await this.resourceModel.findOne(filter);

  if (!resource) {
    throw new NotFoundException('Resource not found');
  }

  return resource;
}

  async update(resourceId: string, dto: UpdateResourceDto) {
    if (Object.keys(dto).length === 0) {
      throw new BadRequestException('No update data provided');
    }

    if (dto.operatingHours) {
      this.validateOperatingHours(dto.operatingHours);
    }

    const resource = await this.resourceModel.findOneAndUpdate(
      {
        _id: resourceId,
        deletedAt: null,
      },
      { $set: dto },
      {
        new: true,
        runValidators: true,
      },
    );

    if (!resource) {
      throw new NotFoundException('Resource not found');
    }

    return resource;
  }

  async remove(resourceId: string) {
    const resource = await this.resourceModel.findOneAndUpdate(
      {
        _id: resourceId,
        deletedAt: null,
      },
      {
        $set: {
          isActive: false,
          deletedAt: new Date(),
        },
      },
      { new: true },
    );

    if (!resource) {
      throw new NotFoundException('Resource not found');
    }

    return {
      message: 'Resource deleted successfully',
    };
  }
}
