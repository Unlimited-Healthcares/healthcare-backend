import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Wallet } from './entities/wallet.entity';
import { WalletTransaction } from './entities/wallet-transaction.entity';
import { WalletsService } from './wallets.service';
import { WalletsController } from './wallets.controller';
import { IntegrationsModule } from '../integrations/integrations.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { User } from '../users/entities/user.entity';

@Module({
    imports: [
        TypeOrmModule.forFeature([Wallet, WalletTransaction, User]),
        IntegrationsModule,
        NotificationsModule,
    ],
    controllers: [WalletsController],
    providers: [WalletsService],
    exports: [WalletsService],
})
export class WalletsModule { }
