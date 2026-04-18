import {
    Controller,
    Get,
    Post,
    Put,
    Body,
    Param,
    UseGuards,
    Request,
    Query,
    UseInterceptors,
    UploadedFiles,
} from '@nestjs/common';
import {
    ApiTags,
    ApiOperation,
    ApiResponse,
    ApiBearerAuth,
    ApiConsumes,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { MedicalVolunteerService } from './medical-volunteer.service';
import { AuthenticatedRequest } from '../types/request.types';
import { FileFieldsInterceptor } from '@nestjs/platform-express';

@ApiTags('medical-volunteer')
@Controller('medical-volunteer')
@ApiBearerAuth('access-token')
export class MedicalVolunteerController {
    constructor(private readonly volunteerService: MedicalVolunteerService) { }

    @Post('submit')
    @UseGuards(JwtAuthGuard)
    @ApiOperation({ summary: 'Submit medical volunteer verification' })
    @ApiResponse({ status: 201, description: 'Submission successful' })
    @ApiConsumes('multipart/form-data')
    @UseInterceptors(FileFieldsInterceptor([
        { name: 'license', maxCount: 1 },
        { name: 'additionalDoc', maxCount: 1 },
    ]))
    async submitVerification(
        @Request() req: AuthenticatedRequest,
        @Body() body: {
            professionalRole: string;
            specialization: string;
            practiceNumber: string;
            country: string;
            professionalBody: string;
            verificationLink?: string;
            issueDate?: string;
            expiryDate?: string;
        },
        @UploadedFiles() files: { license?: Express.Multer.File[], additionalDoc?: Express.Multer.File[] }
    ) {
        const licensePath = files.license?.[0]?.path || 'uploads/mock-license.pdf'; // Fallback for testing if no file uploaded
        const additionalDocPath = files.additionalDoc?.[0]?.path;

        const submission = await this.volunteerService.submitVerification(req.user.id, {
            ...body,
            licenseFilePath: licensePath,
            additionalDocFilePath: additionalDocPath,
        });

        return {
            success: true,
            data: submission,
            message: 'Verification request submitted successfully',
        };
    }

    @Get('my-status')
    @UseGuards(JwtAuthGuard)
    @ApiOperation({ summary: 'Get current user verification status' })
    async getMyStatus(@Request() req: AuthenticatedRequest) {
        const submission = await this.volunteerService.getSubmissionByUserId(req.user.id);
        return {
            success: true,
            data: submission,
        };
    }

    // Admin endpoints
    @Get('submissions')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('admin')
    @ApiOperation({ summary: 'Get all verification submissions (Admin only)' })
    async getAllSubmissions(@Query('status') status?: 'PENDING' | 'APPROVED' | 'REJECTED') {
        const submissions = await this.volunteerService.getAllSubmissions(status ? { status } : {});
        return {
            success: true,
            data: submissions,
        };
    }

    @Put('submissions/:id/review')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('admin')
    @ApiOperation({ summary: 'Review verification submission (Admin only)' })
    async reviewSubmission(
        @Param('id') id: string,
        @Request() req: AuthenticatedRequest,
        @Body() body: { status: 'APPROVED' | 'REJECTED', notes?: string }
    ) {
        const submission = await this.volunteerService.reviewSubmission(
            id,
            req.user.id,
            body.status,
            body.notes
        );

        return {
            success: true,
            data: submission,
            message: `Submission ${body.status.toLowerCase()} successfully`,
        };
    }
}
