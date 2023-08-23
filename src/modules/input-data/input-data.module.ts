import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { InputDataController } from './input-data.controller';
import { InputDataService } from './input-data.service';
import { InputData } from './model/input-data.model';

@Module({
  imports: [SequelizeModule.forFeature([InputData])],
  controllers: [InputDataController],
  providers: [InputDataService],
  exports: [InputDataModule],
})
export class InputDataModule {}
