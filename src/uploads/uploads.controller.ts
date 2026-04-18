import {
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiConsumes } from '@nestjs/swagger';
import { UploadsService } from './uploads.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GetCurrentUserId } from '../auth/decorators/get-current-user-id.decorator';

@ApiTags('uploads')
@Controller('uploads')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('access-token')
export class UploadsController {
  constructor(private readonly uploadsService: UploadsService) { }

  @Post('profile-picture')
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload profile picture' })
  async uploadProfilePicture(
    @UploadedFile() file: Express.Multer.File,
    @GetCurrentUserId() userId: string,
  ) {
    if (!file) {
      throw new BadRequestException('File is required');
    }

    if (!file.mimetype.startsWith('image/')) {
      throw new BadRequestException('Only image files are allowed');
    }

    // Limit size to 5MB
    if (file.size > 5 * 1024 * 1024) {
      throw new BadRequestException('File size must be less than 5MB');
    }

    const url = await this.uploadsService.uploadProfilePicture(file, userId);
    return { url };
  }

  @Post('business-asset')
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload business asset (logo or registration document)' })
  async uploadBusinessAsset(
    @UploadedFile() file: Express.Multer.File,
    @GetCurrentUserId() userId: string,
  ) {
    if (!file) {
      throw new BadRequestException('File is required');
    }

    // Determine type from filename or size if needed, but here we just upload to center-bucket
    // Limit size to 10MB for documents
    if (file.size > 10 * 1024 * 1024) {
      throw new BadRequestException('File size must be less than 10MB');
    }

    const url = await this.uploadsService.uploadBusinessAsset(file, userId);
    return { url };
  }

  @Post('identity-document')
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload government-issued identity document' })
  async uploadIdentityDocument(
    @UploadedFile() file: Express.Multer.File,
    @GetCurrentUserId() userId: string,
  ) {
    if (!file) {
      throw new BadRequestException('File is required');
    }

    // Limit size to 5MB for IDs
    if (file.size > 5 * 1024 * 1024) {
      throw new BadRequestException('File size must be less than 5MB');
    }

    const url = await this.uploadsService.uploadIdentityDocument(file, userId);
    return { url };
  }

  @Post('chat')
  @UseInterceptors(FileInterceptor('file', {
    limits: {
      fileSize: 100 * 1024 * 1024, // 100MB total ceiling
    }
  }))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload chat media (images, videos, documents)' })
  async uploadChatMedia(
    @UploadedFile() file: Express.Multer.File,
    @GetCurrentUserId() userId: string,
  ) {
    if (!file) {
      throw new BadRequestException('File is required');
    }

    const isVideo = file.mimetype.startsWith('video/');
    const maxSize = isVideo ? 100 * 1024 * 1024 : 10 * 1024 * 1024; // 100MB for video, 10MB for others

    if (file.size > maxSize) {
      throw new BadRequestException(`File size must be less than ${isVideo ? '100MB' : '10MB'}`);
    }

    const url = await this.uploadsService.uploadChatMedia(file, userId);
    return { url };
  }
}
