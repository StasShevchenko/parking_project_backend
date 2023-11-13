import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { QueueService } from 'src/modules/queue/queue.service';
import { UserService } from 'src/modules/user/user.service';
import { AcceptDeclineSwap } from './dto/accept_decline_swap.dto';
import { GetAllSwapByUserId } from './dto/get_swap_by_userId.dto';
import { Swap } from './model/swap.model';

@Injectable()
export class SwapService {
  @InjectModel(Swap) private readonly swapRepository: typeof Swap;
  constructor(
    private readonly queueService: QueueService,
    private readonly userService: UserService,
  ) {}

  async CreateNewSwap(dto): Promise<Swap> {
    try {
      let sent = new Date(dto.sent);
      let from = new Date(dto.swap.from);
      let to = new Date(dto.swap.to);
      return await this.swapRepository.create({
        is_active: true,
        sent: sent,
        from: from,
        to: to,
        sender: dto.sender.id,
        sender_fullName: dto.sender.fullName,
        sender_email: dto.sender.email,
        receiver: dto.receiver.id,
        receiver_fullName: dto.receiver.fullName,
        receiver_email: dto.receiver.email,
      });
    } catch (e) {
      console.log(e);
      throw new BadRequestException();
    }
  }

  async GetAllSwapByUserId(dto: GetAllSwapByUserId) {
    try {
      let UserSenderSwap: Swap[] = await this.swapRepository.findAll({
        where: { sender: dto.userId },
      });
      let UserReceiverSwap: Swap[] = await this.swapRepository.findAll({
        where: { receiver: dto.userId },
      });
      let response = [];
      // Запросы на обмен, которые отправил наш пользователь
      for (var swap of UserSenderSwap) {
        const SwapData = {
          id: swap.id,
          is_active: swap.is_active,
          result: swap.result,
          sent: swap.sent,
          swap: {
            from: swap.from,
            to: swap.to,
          },
          sender: {
            id: swap.sender,
            fullName: swap.sender_fullName,
            email: swap.sender_email,
          },
          receiver: {
            id: swap.receiver,
            fullName: swap.receiver_fullName,
            email: swap.receiver_email,
          },
        };
        response.push(SwapData);
      }
      // Запросы на обмен, которые пришли нашему пользователю
      for (var swap of UserReceiverSwap) {
        const SwapData = {
          id: swap.id,
          is_active: swap.is_active,
          result: swap.result,
          sent: swap.sent,
          swap: {
            from: swap.from,
            to: swap.to,
          },
          sender: {
            id: swap.sender,
            fullName: swap.sender_fullName,
            email: swap.sender_email,
          },
          receiver: {
            id: swap.receiver,
            fullName: swap.receiver_fullName,
            email: swap.receiver_email,
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

  async AcceptSwap(dto: AcceptDeclineSwap) {
    try {
      let swap = await this.swapRepository.findByPk(dto.id);
      let senderUser = await this.userService.findUserById(swap.sender);
      let receiverUser = await this.userService.findUserById(swap.receiver);
      // Если соглашается получатель запроса и запрос еще не обработан
      if (swap.receiver == dto.userId && swap.is_active == true) {
        // Если оба юзера неактивны, то меняемся
        if (senderUser.active || receiverUser.active) {
          throw new BadRequestException({
            message: 'Один из пользователей активен',
          });
        } else {
          await this.queueService.SwapUsers(swap.receiver, swap.sender);
          swap.is_active = false;
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

  async DeclineSwap(dto: AcceptDeclineSwap): Promise<boolean> {
    try {
      let swap = await this.swapRepository.findByPk(dto.id);
      // Если соглашается получатель запроса и запрос еще не обработан
      if (swap.receiver == dto.userId && swap.is_active == true) {
        swap.is_active = false;
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
