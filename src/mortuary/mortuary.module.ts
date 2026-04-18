import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MortuaryRecord } from './entities/mortuary-record.entity';
import { MortuaryService } from './mortuary.service';
import { MortuaryController } from './mortuary.controller';

@Module({
    imports: [TypeOrmModule.forFeature([MortuaryRecord])],
    controllers: [MortuaryController],
    providers: [MortuaryService],
    exports: [MortuaryService],
})
export class MortuaryModule { }
