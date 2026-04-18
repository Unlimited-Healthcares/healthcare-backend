import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { SearchService, SearchResult } from './search.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { GetCurrentUserId } from '../auth/decorators/get-current-user-id.decorator';
import { GetCurrentUser } from '../auth/decorators/get-current-user.decorator';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('search')
@Controller('search')
@UseGuards(JwtAuthGuard, RolesGuard)
export class SearchController {
    constructor(private readonly searchService: SearchService) { }

    @Get('global')
    @ApiOperation({ summary: 'Global search across all entities' })
    @ApiResponse({ status: 200, description: 'Search results' })
    async globalSearch(
        @Query('query') query: string,
        @GetCurrentUserId() userId: string,
        @GetCurrentUser('roles') roles: string[],
    ): Promise<SearchResult[]> {
        if (!query || query.length < 2) {
            return [];
        }
        return this.searchService.globalSearch(query, roles, userId);
    }

    @Get('suggestions')
    @ApiOperation({ summary: 'Get search suggestions' })
    @ApiResponse({ status: 200, description: 'List of suggestions' })
    async getSuggestions(
        @Query('q') query: string,
        @Query('type') type?: 'users' | 'centers',
    ): Promise<string[]> {
        if (!query || query.length < 2) {
            return [];
        }
        return this.searchService.getSuggestions(query, type);
    }
}
