import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';
import { UsersService } from '../../users/users.service';
import { TokenBlacklistService } from '../services/token-blacklist.service';
import { JwtPayload } from '../interfaces/jwt-payload.interface';
import { JwtUser } from '../../types/request.types';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private configService: ConfigService,
    private usersService: UsersService,
    private tokenBlacklistService: TokenBlacklistService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET'),
      passReqToCallback: true,
    });
  }

  async validate(req: Request, payload: JwtPayload): Promise<JwtUser> {
    const token = ExtractJwt.fromAuthHeaderAsBearerToken()(req);
    
    if (token && await this.tokenBlacklistService.isTokenBlacklisted(token)) {
      throw new UnauthorizedException('Token has been invalidated');
    }
    
    const user = await this.usersService.findById(payload.sub);
    if (!user) {
      throw new UnauthorizedException();
    }
    return { 
      id: payload.sub,
      sub: payload.sub,
      userId: payload.sub,
      email: payload.email,
      roles: payload.roles,
    };
  }
}
