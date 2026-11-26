
import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';

import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import type { Model } from 'mongoose';
import { User, UserRole } from '../../users/schemas/user.shema.js';

interface AccessTokenPayload {
  sub: string;
  role: UserRole;
}

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,

    @InjectModel(User.name)
    private readonly userModel: Model<User>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();

    const [type, token] =
      request.headers.authorization?.split(' ') ?? [];

    if (type !== 'Bearer' || !token) {
      throw new UnauthorizedException('Access token is required');
    }

    let payload: AccessTokenPayload;

    try {
      payload =
        await this.jwtService.verifyAsync<AccessTokenPayload>(token);
    } catch {
      throw new UnauthorizedException('Invalid or expired access token');
    }

    const user = await this.userModel
      .findById(payload.sub)
      .select('isActive')
      .lean();

    if (!user || user.isActive !== true) {
      throw new UnauthorizedException(
        'Account is inactive or no longer exists',
      );
    }

    request.user = {
      sub: payload.sub,
      role: payload.role,
    };

    return true;
  }
}
