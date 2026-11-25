import {
  Injectable,
  ConflictException,
  UnauthorizedException,
} from '@nestjs/common';

import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';

import { User, UserRole } from '../users/schemas/user.shema.js';
import { UserSession } from '../sessions/schemas/user.session.schema.js';

import { RegisterDto } from './dto/register.dto.js';
import { LoginDto } from './dto/login.dto.js';

interface TokenPayload {
  sub: string;
  role: UserRole;
  sid?: string;
}

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name)
    private readonly userModel: Model<User>,

    @InjectModel(UserSession.name)
    private readonly sessionModel: Model<UserSession>,

    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async register(dto: RegisterDto) {
    const email = dto.email.toLowerCase().trim();

    const existingUser = await this.userModel.findOne({ email });

    if (existingUser) {
      throw new ConflictException('Email already exists');
    }

    const passwordHash = await bcrypt.hash(dto.password, 12);

    try {
      const user = await this.userModel.create({
        name: dto.name,
        email,
        passwordHash,
        role: UserRole.CUSTOMER,
      });

      return {
        message: 'Account created successfully',
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
      };
    } catch (error) {
      if (
        typeof error === 'object' &&
        error !== null &&
        'code' in error &&
        error.code === 11000
      ) {
        throw new ConflictException('Email already exists');
      }
      throw error;
    }
  }

  async login(dto: LoginDto) {
    const user = await this.userModel
      .findOne({ email: dto.email.toLowerCase().trim() })
      .select('+passwordHash');

    if (!user || !(await bcrypt.compare(dto.password, user.passwordHash))) {
      throw new UnauthorizedException('Invalid email or password');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Account is deactivated');
    }

    return this.createSession(user.id, user.role);
  }

  private async createSession(userId: string, role: UserRole) {
    const session = await this.sessionModel.create({
      userId,
      refreshTokenHash: 'temporary',
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });

    const payload: TokenPayload = {
      sub: userId,
      role,
      sid: session.id,
    };

    const accessToken = await this.jwtService.signAsync({
      sub: userId,
      role,
    });

    const refreshToken = await this.jwtService.signAsync(payload, {
      secret: this.configService.getOrThrow<string>('JWT_REFRESH_SECRET'),
      expiresIn: '7d',
    });

    session.refreshTokenHash = await bcrypt.hash(refreshToken, 12);
    await session.save();

    return {
      accessToken,
      refreshToken,
      tokenType: 'Bearer',
    };
  }

  async refresh(refreshToken: string) {
    let payload: TokenPayload;

    try {
      payload = await this.jwtService.verifyAsync<TokenPayload>(refreshToken, {
        secret: this.configService.getOrThrow<string>('JWT_REFRESH_SECRET'),
      });
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }

    if (!payload.sid) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const session = await this.sessionModel
      .findOne({
        _id: payload.sid,
        userId: payload.sub,
        revokedAt: null,
        expiresAt: { $gt: new Date() },
      })
      .select('+refreshTokenHash');

    if (
      !session ||
      !(await bcrypt.compare(refreshToken, session.refreshTokenHash))
    ) {
      throw new UnauthorizedException('Invalid refresh session');
    }

    const user = await this.userModel.findById(payload.sub);

    if (!user || !user.isActive) {
      throw new UnauthorizedException('Account is unavailable');
    }

    const newAccessToken = await this.jwtService.signAsync({
      sub: user.id,
      role: user.role,
    });

    const newRefreshToken = await this.jwtService.signAsync(
      {
        sub: user.id,
        role: user.role,
        sid: session.id,
      },
      {
        secret: this.configService.getOrThrow<string>('JWT_REFRESH_SECRET'),
        expiresIn: '7d',
      },
    );

    const newHash = await bcrypt.hash(newRefreshToken, 12);

    const result = await this.sessionModel.updateOne(
      {
        _id: session.id,
        refreshTokenHash: session.refreshTokenHash,
        revokedAt: null,
      },
      {
        $set: {
          refreshTokenHash: newHash,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          lastUsedAt: new Date(),
        },
      },
    );

    if (result.modifiedCount !== 1) {
      throw new UnauthorizedException('Refresh token already used');
    }

    return {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
      tokenType: 'Bearer',
    };
  }

  async logout(refreshToken: string) {
    let payload: TokenPayload;

    try {
      payload = await this.jwtService.verifyAsync<TokenPayload>(refreshToken, {
        secret: this.configService.getOrThrow<string>('JWT_REFRESH_SECRET'),
      });
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }

    if (!payload.sid) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const session = await this.sessionModel
      .findOne({
        _id: payload.sid,
        userId: payload.sub,
        revokedAt: null,
      })
      .select('+refreshTokenHash');

    if (
      !session ||
      !(await bcrypt.compare(refreshToken, session.refreshTokenHash))
    ) {
      throw new UnauthorizedException('Invalid refresh session');
    }

    session.revokedAt = new Date();
    await session.save();

    return { message: 'Logged out successfully' };
  }
}
