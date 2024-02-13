import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { QueueService } from 'src/modules/queue/queue.service';
import { UserService } from 'src/modules/user/user.service';
import { AcceptDeclineSwapDto } from './dto/acceptDeclineSwapDto';
import { GetAllSwapByUserId } from './dto/get_swap_by_userId.dto';
import { Swap } from './model/swap.model';
import {CreateSwapRequestDto} from "./dto/createSwapRequest.dto";
import {getZeroTimezoneDate} from "../../utils/getZeroTimezoneDate";

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
        is_active: true,
        sent: sent,
        from: from,
        to: to,
        sender: dto.senderId,
        sender_fullName: `${sender.firstName} ${sender.secondName}`,
        sender_email: sender.email,
        receiver: receiver.id,
        receiver_fullName: `${receiver.firstName} ${receiver.secondName}`,
        receiver_email: receiver.email,
      });
    } catch (e) {
      console.log(e);
      throw new BadRequestException();
    }
  }

  async GetAllSwapByUserId(dto: GetAllSwapByUserId) {
    try {
      const UserSenderSwap: Swap[] = await this.swapRepository.findAll({
        where: { sender: dto.userId },
      });
      const UserReceiverSwap: Swap[] = await this.swapRepository.findAll({
        where: { receiver: dto.userId },
      });
      const response = [];
      // Запросы на обмен, которые отправил наш пользователь
      for (var swap of UserSenderSwap) {
        const SwapData = {
          id: swap.id,
          is_active: swap.active,
          result: swap.result,
          sent: swap.sent,
          swap: {
            from: swap.from,
            to: swap.to,
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
        response.push(SwapData);
      }
      // Запросы на обмен, которые пришли нашему пользователю
      for (var swap of UserReceiverSwap) {
        const SwapData = {
          id: swap.id,
          is_active: swap.active,
          result: swap.result,
          sent: swap.sent,
          swap: {
            from: swap.from,
            to: swap.to,
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
        response.push(SwapData);
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
