import { createParamDecorator, ExecutionContext, UnauthorizedException } from '@nestjs/common';

export const GetCurrentUserId = createParamDecorator(
  (_: undefined, context: ExecutionContext): string => {
    const request = context.switchToHttp().getRequest();
    
    if (!request.user) {
      throw new UnauthorizedException('User not authenticated');
    }
    
    // Check multiple possible locations for the user ID
    if (request.user.sub) {
      return request.user.sub;
    } else if (request.user.userId) {
      return request.user.userId;
    } else if (request.user.id) {
      return request.user.id;
    }
    
    throw new UnauthorizedException('User ID not found in token');
  },
);
