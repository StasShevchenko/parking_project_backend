import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { QueueService } from 'src/modules/queue/queue.service';
import { UserService } from 'src/modules/user/user.service';
import { AcceptDeclineSwapDto } from './dto/acceptDeclineSwapDto';
import { GetAllSwapByUserId } from './dto/get_swap_by_userId.dto';
import { Swap } from './model/swap.model';
import {CreateSwapRequestDto} from "./dto/createSwapRequest.dto";
import {getZeroTimezoneDate} from "../../utils/getZeroTimezoneDate";
import {SwapResponseDto} from "./dto/swapResponse.dto";

@Injectable()
export class SwapService {
  @InjectModel(Swap) private readonly swapRepository: typeof Swap;
  constructor(
    private readonly queueService: QueueService,
    private readonly userService: UserService,
  ) {}

  async createNewSwapRequest(dto: CreateSwapRequestDto): Promise<Swap> {
    try {
      const sent = getZeroTimezoneDate(new Date());
      const sender = await this.userService.findUserById(dto.senderId)
      const receiver = await this.userService.findUserById(dto.receiverId)
      const from = sender.startActiveTime;
      const to = receiver.startActiveTime;
      return await this.swapRepository.create({
        active: true,
        sent: sent,
        from: from,
        to: to,
        sender: dto.senderId,
        senderFullName: `${sender.firstName} ${sender.secondName}`,
        senderEmail: sender.email,
        receiver: receiver.id,
        receiverFullName: `${receiver.firstName} ${receiver.secondName}`,
        receiverEmail: receiver.email,
      });
    } catch (e) {
      console.log(e);
      throw new BadRequestException();
    }
  }

  async getSwapRequestsByUserId(userId: number): Promise<SwapResponseDto[]> {
    try {
      const userAsSenderSwapRequests: Swap[] = await this.swapRepository.findAll({
        where: { sender: userId },
      });
      const userAsReceiverSwapRequests: Swap[] = await this.swapRepository.findAll({
        where: { receiver: userId },
      });
      const response: SwapResponseDto[] = [];
      // Запросы на обмен, которые отправил наш пользователь
      for (let swap of userAsSenderSwapRequests) {
        const swapItem: SwapResponseDto = {
          id: swap.id,
          isActive: swap.active,
          result: swap.result,
          sent: swap.sent,
          swapInfo: {
            from: swap.from,
            to: swap.to
          },
          sender: {
            id: swap.sender,
            fullName: swap.senderFullName,
            email: swap.senderEmail,
          },
          receiver: {
            id: swap.receiver,
            fullName: swap.receiverFullName,
            email: swap.receiverEmail,
          },
        };
        response.push(swapItem);
      }
      // Запросы на обмен, которые пришли нашему пользователю
      for (let swap of userAsReceiverSwapRequests) {
        const swapItem: SwapResponseDto = {
          id: swap.id,
          isActive: swap.active,
          result: swap.result,
          sent: swap.sent,
          swapInfo: {
            from: swap.from,
            to: swap.to
          },
          sender: {
            id: swap.sender,
            fullName: swap.senderFullName,
            email: swap.senderEmail,
          },
          receiver: {
            id: swap.receiver,
            fullName: swap.receiverFullName,
            email: swap.receiverEmail,
          },
        };
        response.push(swapItem);
      }
      return response;
    } catch (e) {
      console.log(e);
      throw new BadRequestException();
    }
  }

  async AcceptSwap(dto: AcceptDeclineSwapDto) {
    try {
      const swap = await this.swapRepository.findByPk(dto.id);
      const senderUser = await this.userService.findUserById(swap.sender);
      const receiverUser = await this.userService.findUserById(swap.receiver);
      // Если соглашается получатель запроса и запрос еще не обработан
      if (swap.receiver == dto.userId && swap.active == true) {
        // Если оба юзера неактивны, то меняемся
        if (senderUser.active || receiverUser.active) {
          throw new BadRequestException({
            message: 'Один из пользователей активен',
          });
        } else {
          await this.queueService.swapUsers(swap.receiver, swap.sender);
          swap.active = false;
          swap.result = true;
          await swap.save();
          return true;
        }
      } else {
        throw new BadRequestException();
      }
    } catch (e) {
      console.log(e);
      throw new BadRequestException();
    }
  }

  async DeclineSwap(dto: AcceptDeclineSwapDto): Promise<boolean> {
    try {
      const swap = await this.swapRepository.findByPk(dto.id);
      // Если соглашается получатель запроса и запрос еще не обработан
      if (swap.receiver == dto.userId && swap.active == true) {
        swap.active = false;
        swap.result = false;
        await swap.save();
        return true;
      } else {
        throw new BadRequestException();
      }
    } catch (e) {
      console.log(e);
      throw new BadRequestException();
    }
  }
}
