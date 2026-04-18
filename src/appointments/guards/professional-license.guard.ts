
import {
    Injectable,
    CanActivate,
    ExecutionContext,
    ForbiddenException,
    NotFoundException,
} from '@nestjs/common';
import { UsersService } from '../../users/users.service';

/**
 * Guard to ensure that a professional provider has a valid (non-expired) license
 * before allowing them to be booked for an appointment.
 */
@Injectable()
export class ProfessionalLicenseGuard implements CanActivate {
    constructor(private readonly usersService: UsersService) { }

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const request = context.switchToHttp().getRequest();
        const body = request.body;

        // Check both standard and recurring appointment DTOs for providerId
        const providerId = body.providerId;

        // If no provider is specified in the request, we bypass this guard
        // and let the service handles the default provider logic or validation.
        if (!providerId) {
            return true;
        }

        try {
            const provider = await this.usersService.findById(providerId);

            if (!provider) {
                throw new NotFoundException('Professional provider not found');
            }

            // Only check license for professional roles (doctor, nurse)
            const isProfessional = provider.roles?.some(role =>
                ['doctor', 'nurse'].includes(role.toLowerCase())
            );

            if (!isProfessional) {
                return true;
            }

            if (!provider.licenseExpiryDate) {
                throw new ForbiddenException(
                    'Professional license verification required before booking. Please update your profile with a valid expiry date.',
                );
            }

            const expiryDate = new Date(provider.licenseExpiryDate);
            const now = new Date();

            // STRICT BLOCK: If expired, block the booking
            if (expiryDate <= now) {
                throw new ForbiddenException(
                    `Cannot book appointment: Professional license for ${provider.profile?.displayName || provider.email} has expired.`,
                );
            }

            return true;
        } catch (error) {
            if (error instanceof ForbiddenException || error instanceof NotFoundException) {
                throw error;
            }
            // Log other errors but maybe don't block? 
            // Actually, for a "STRICT BLOCK", we should probably block if we can't verify.
            console.error('License verification error:', error);
            throw new ForbiddenException('Unable to verify professional license status at this time.');
        }
    }
}
