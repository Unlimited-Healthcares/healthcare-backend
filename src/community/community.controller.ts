import {
  Controller, Get, Post, Body, UseGuards, Query, Param,
  UseInterceptors, UploadedFiles, BadRequestException,
} from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { CommunityService } from './community.service';
import { CreatePostDto } from './dto/create-post.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GetCurrentUser } from '../auth/decorators/get-current-user.decorator';
import { GetCurrentUserId } from '../auth/decorators/get-current-user-id.decorator';
import { User } from '../users/entities/user.entity';
import { UploadsService } from '../uploads/uploads.service';

@Controller('community')
@UseGuards(JwtAuthGuard)
export class CommunityController {
  constructor(
    private readonly communityService: CommunityService,
    private readonly uploadsService: UploadsService,
  ) { }

  @Get('posts')
  async getPosts(@Query('category') category?: string) {
    return this.communityService.findAll(category);
  }

  @Post('posts')
  @UseInterceptors(FileFieldsInterceptor([
    { name: 'image', maxCount: 1 },
    { name: 'video', maxCount: 1 },
  ]))
  async createPost(
    @Body() createPostDto: CreatePostDto,
    @GetCurrentUser() user: User,
    @GetCurrentUserId() userId: string,
    @UploadedFiles() files?: { image?: Express.Multer.File[]; video?: Express.Multer.File[] },
  ) {
    // Upload image if provided
    if (files?.image?.[0]) {
      const imgFile = files.image[0];
      if (!imgFile.mimetype.startsWith('image/')) {
        throw new BadRequestException('Only image files are allowed for the image field');
      }
      if (imgFile.size > 10 * 1024 * 1024) {
        throw new BadRequestException('Image must be under 10 MB');
      }
      createPostDto.image = await this.uploadsService.uploadCommunityMedia(imgFile, userId);
    }

    // Upload video if provided
    if (files?.video?.[0]) {
      const vidFile = files.video[0];
      const allowedVideoTypes = ['video/mp4', 'video/webm', 'video/quicktime'];
      if (!allowedVideoTypes.includes(vidFile.mimetype)) {
        throw new BadRequestException('Only mp4, webm, or mov videos are allowed');
      }
      if (vidFile.size > 100 * 1024 * 1024) {
        throw new BadRequestException('Video must be under 100 MB');
      }
      createPostDto.video = await this.uploadsService.uploadCommunityMedia(vidFile, userId);
    }

    return this.communityService.create(createPostDto, user);
  }

  @Post('posts/:id/like')
  async likePost(@Param('id') id: string) {
    return this.communityService.like(id);
  }

  @Get('suggested-members')
  async getSuggestedMembers() {
    return this.communityService.getSuggestedMembers();
  }

  @Get('upcoming-events')
  async getUpcomingEvents() {
    return this.communityService.getUpcomingEvents();
  }
}
