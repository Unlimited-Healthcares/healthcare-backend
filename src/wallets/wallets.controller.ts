import { Controller, Get, Post, Body, UseGuards, Param, Patch, Request, BadRequestException } from '@nestjs/common';
import { AuthenticatedRequest } from '../types/request.types';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Public } from '../auth/decorators/public.decorator';
import { WalletsService } from './wallets.service';


@Controller('wallets')
@UseGuards(JwtAuthGuard)
export class WalletsController {
    constructor(private readonly walletsService: WalletsService) { }

    @Get('balance')
    async getBalance(@Request() req: AuthenticatedRequest) {
        return await this.walletsService.getWalletBalance(req.user.id);
    }

    @Patch('onboarding')
    async completeOnboarding(@Request() req: AuthenticatedRequest, @Body() data: { minimumAmount: number, currency?: string }) {
        if (!data.minimumAmount || data.minimumAmount < 0) {
            throw new BadRequestException('Invalid minimum top-up amount');
        }
        return await this.walletsService.completeOnboarding(req.user.id, data.minimumAmount, data.currency);
    }

    @Patch('settings')
    async updateSettings(@Request() req: AuthenticatedRequest, @Body() data: {
        minimumAmount?: number,
        currency?: string,
        isAutoTopUpEnabled?: boolean,
        rechargeThreshold?: number,
        rechargeAmount?: number,
        monthlySpendMax?: number
    }) {
        return await this.walletsService.updateSettings(req.user.id, data);
    }

    @Post('deposit')
    async initializeDeposit(
        @Request() req: AuthenticatedRequest,
        @Body() data: { amount: number, redirectUrl: string, paymentMethod?: string }
    ) {
        return await this.walletsService.initializeDeposit(
            req.user.id,
            data.amount,
            req.user.email,
            data.redirectUrl,
            data.paymentMethod
        );
    }

    @Post('activate')
    async initializeActivation(
        @Request() req: AuthenticatedRequest,
        @Body() data: { redirectUrl: string, paymentMethod?: string }
    ) {
        return await this.walletsService.initializeActivationPayment(
            req.user.id,
            req.user.email,
            data.redirectUrl,
            data.paymentMethod
        );
    }

    @Get('verify/:reference')
    async verifyDeposit(@Param('reference') reference: string) {
        return await this.walletsService.processDeposit(reference);
    }

    @Public()
    @Post('webhook/paystack')
    async handlePaystackWebhook(@Request() req: AuthenticatedRequest, @Body() body: Record<string, unknown>) {
        const signature = req.headers['x-paystack-signature'] as string;
        return await this.walletsService.handlePaystackWebhook(body, signature);
    }

    @Public()
    @Post('webhook/flutterwave')
    async handleFlutterwaveWebhook(@Request() req: AuthenticatedRequest, @Body() body: Record<string, unknown>) {
        const signature = req.headers['verif-hash'] as string;
        return await this.walletsService.handleFlutterwaveWebhook(body, signature);
    }

    @Get('history')
    async getHistory(@Request() req: AuthenticatedRequest) {
        return await this.walletsService.getTransactionHistory(req.user.id);
    }
}
