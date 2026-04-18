import { Controller, Get, Post, Delete, Body, Param, Query, UseGuards, BadRequestException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CacheService } from './cache.service';
import { IsString, IsNotEmpty, IsOptional, IsNumber } from 'class-validator';

class CacheSetDto {
  @IsString()
  @IsNotEmpty()
  key: string;

  @IsNotEmpty()
  value: unknown;

  @IsOptional()
  @IsNumber()
  ttl?: number;
}

interface CacheGetResponse {
  hit: boolean;
  data?: unknown;
  ttl?: number;
  key: string;
  timestamp: string;
}

interface CacheStatsResponse {
  totalKeys: number;
  memoryUsage: string;
  hitRate: number;
  lastReset: string;
}

@ApiTags('cache')
@ApiBearerAuth('access-token')
@Controller('cache')
@UseGuards(JwtAuthGuard, RolesGuard)
export class CacheController {
  constructor(private readonly cacheService: CacheService) {}

  @Get(':key')
  @Roles('admin')
  @ApiOperation({ summary: 'Get value from cache by key' })
  @ApiParam({ name: 'key', description: 'Cache key to retrieve' })
  @ApiResponse({ 
    status: 200, 
    description: 'Cache value retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        hit: { type: 'boolean' },
        data: { type: 'object' },
        ttl: { type: 'number' },
        key: { type: 'string' },
        timestamp: { type: 'string' }
      }
    }
  })
  @ApiResponse({ status: 404, description: 'Key not found in cache' })
  async get(@Param('key') key: string): Promise<CacheGetResponse> {
    const value = await this.cacheService.get(key);
    const response: CacheGetResponse = {
      hit: value !== undefined,
      data: value,
      key,
      timestamp: new Date().toISOString()
    };
    
    if (value !== undefined) {
      // Note: TTL information is not directly available from cache-manager
      // This is a simplified response
      response.ttl = 3600; // Default TTL
    }
    
    return response;
  }

  @Post()
  @Roles('admin')
  @ApiOperation({ summary: 'Set value in cache' })
  @ApiResponse({ status: 201, description: 'Value cached successfully' })
  @ApiResponse({ status: 400, description: 'Invalid request data' })
  async set(@Body() cacheSetDto: CacheSetDto): Promise<{ message: string; key: string }> {
    if (!cacheSetDto.key || cacheSetDto.key.trim() === '') {
      throw new BadRequestException('Cache key is required and cannot be empty');
    }
    
    await this.cacheService.set(cacheSetDto.key, cacheSetDto.value, cacheSetDto.ttl);
    return {
      message: 'Value cached successfully',
      key: cacheSetDto.key
    };
  }

  @Delete(':key')
  @Roles('admin')
  @ApiOperation({ summary: 'Delete value from cache by key' })
  @ApiParam({ name: 'key', description: 'Cache key to delete' })
  @ApiResponse({ status: 200, description: 'Cache key deleted successfully' })
  @ApiResponse({ status: 404, description: 'Key not found in cache' })
  async delete(@Param('key') key: string): Promise<{ message: string; key: string }> {
    await this.cacheService.delete(key);
    return {
      message: 'Cache key deleted successfully',
      key
    };
  }

  @Delete()
  @Roles('admin')
  @ApiOperation({ summary: 'Reset entire cache' })
  @ApiResponse({ status: 200, description: 'Cache reset successfully' })
  async reset(): Promise<{ message: string; timestamp: string }> {
    await this.cacheService.reset();
    return {
      message: 'Cache reset successfully',
      timestamp: new Date().toISOString()
    };
  }

  @Get('stats/overview')
  @Roles('admin')
  @ApiOperation({ summary: 'Get cache statistics' })
  @ApiResponse({ 
    status: 200, 
    description: 'Cache statistics retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        totalKeys: { type: 'number' },
        memoryUsage: { type: 'string' },
        hitRate: { type: 'number' },
        lastReset: { type: 'string' }
      }
    }
  })
  async getStats(): Promise<CacheStatsResponse> {
    // Note: This is a simplified implementation
    // In a real scenario, you'd get actual cache statistics
    return {
      totalKeys: 0, // Would be calculated from actual cache
      memoryUsage: '0 MB',
      hitRate: 0.0,
      lastReset: new Date().toISOString()
    };
  }

  @Post('generate-key')
  @Roles('admin')
  @ApiOperation({ summary: 'Generate cache key from parameters' })
  @ApiQuery({ name: 'prefix', description: 'Key prefix' })
  @ApiResponse({ status: 200, description: 'Cache key generated successfully' })
  async generateKey(
    @Query('prefix') prefix: string,
    @Body() params: Record<string, unknown>
  ): Promise<{ key: string; prefix: string; params: Record<string, unknown> }> {
    if (!prefix || prefix.trim() === '') {
      throw new BadRequestException('Prefix is required');
    }
    
    const key = this.cacheService.generateKey(prefix, params);
    return {
      key,
      prefix,
      params
    };
  }
} 