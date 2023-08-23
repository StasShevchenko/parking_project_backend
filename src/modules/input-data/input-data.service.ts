import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { CreateInputDataDto } from './dto/create-input-data.dto';
import { UpdateInputDataDto } from './dto/update-input-data.dto';
import { InputData } from './model/input-data.model';

@Injectable()
export class InputDataService {
  @InjectModel(InputData)
  private readonly inputDataRepository: typeof InputData;

  async create(dto: CreateInputDataDto): Promise<CreateInputDataDto> {
    if ((await this.inputDataRepository.count()) != 0) {
      throw new BadRequestException('Поля seats и period уже созданы!');
    } else {
      return await this.inputDataRepository.create({
        seats: dto.seats,
        period: dto.period,
        numberOfOutputPeriods: dto.numberOfOutputPeriods,
      });
    }
  }

  async get(): Promise<InputData> {
    return await this.inputDataRepository.findOne({
      attributes: { exclude: ['createdAt', 'updatedAt', 'id'] },
    });
  }

  async update(dto: UpdateInputDataDto): Promise<InputData> {
    try {
      const data = await this.inputDataRepository.findOne({});
      await data.update(dto);
      await data.save();
      return data;
    } catch (e) {
      throw new BadRequestException('Wrond Data');
    }
  }
}
