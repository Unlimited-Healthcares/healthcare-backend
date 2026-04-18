import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Request } from 'express';
import { ConfigService } from '@nestjs/config';
import { JwtPayload } from '../interfaces/jwt-payload.interface';

@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(Strategy, 'jwt-refresh') {
  private readonly logger = new Logger(JwtRefreshStrategy.name);
  
  constructor(private configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: configService.get<string>('JWT_REFRESH_SECRET'),
      passReqToCallback: true,
    });
  }

  validate(req: Request, payload: JwtPayload) {
    this.logger.debug(`JWT Refresh validate called`);
    
    const authHeader = req.get('Authorization');
    if (!authHeader) {
      this.logger.warn('Authorization header missing');
      throw new UnauthorizedException('Authorization header missing');
    }
    
    const refreshToken = authHeader.replace('Bearer ', '').trim();
    if (!refreshToken) {
      this.logger.warn('Refresh token malformed (empty after Bearer prefix removal)');
      throw new UnauthorizedException('Refresh token malformed');
    }
    
    return { 
      ...payload,
      refreshToken,
      userId: payload.sub
    };
  }
}
