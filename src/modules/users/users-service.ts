import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { InjectModel } from '@nestjs/mongoose';
import type { Model } from 'mongoose';

import { User } from './schemas/user.shema.js';
import { UpdateProfileDto } from './dto/update-profile.dto.js';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name)
    private readonly userModel: Model<User>,
  ) {}

  async getMyProfile(userId: string) {
    const user = await this.userModel.findById(userId);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async updateMyProfile(userId: string, dto: UpdateProfileDto) {
    if (Object.keys(dto).length === 0) {
      throw new BadRequestException('No update data provided');
    }

    try {
      const updates: Partial<Pick<User, 'name' | 'email'>> = {};

      if (dto.name !== undefined) {
        updates.name = dto.name;
      }

      if (dto.email !== undefined) {
        updates.email = dto.email;
      }

      const user = await this.userModel.findByIdAndUpdate(
        userId,
        { $set: updates },
        { new: true, runValidators: true },
      );

      if (!user) {
        throw new NotFoundException('User not found');
      }

      return user;
    } catch (error) {
      if ((error as { code?: number }).code === 11000) {
        throw new ConflictException('Email already exists');
      }

      throw error;
    }
  }

  async findAll() {
    return this.userModel.find().sort({ createdAt: -1 });
  }

  async findOne(userId: string) {
    const user = await this.userModel.findById(userId);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async updateStatus(userId: string, isActive: boolean) {
    const user = await this.userModel.findByIdAndUpdate(
      userId,
      { $set: { isActive } },
      { new: true, runValidators: true },
    );

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }
}
