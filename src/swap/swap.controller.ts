import { Body, Controller, Post } from '@nestjs/common';
import {
  ApiForbiddenResponse,
  ApiOperation,
  ApiResponse,
  ApiTags,
  ApiUnprocessableEntityResponse,
} from '@nestjs/swagger';
import { AcceptDeclineSwap } from './dto/accept_decline_swap.dto';
import { GetAllSwapByUserId } from './dto/get_swap_by_userId.dto';
import { Swap } from './model/swap.model';
import { SwapService } from './swap.service';

@ApiTags('Swap')
@Controller('swap')
export class SwapController {
  constructor(private readonly swapService: SwapService) {}

  @ApiOperation({
    summary: 'Создание запроса на обмен - только авторизованным',
  })
  @ApiResponse({
    status: 201,
  })
  @ApiUnprocessableEntityResponse({ description: 'Bad Request' })
  @ApiForbiddenResponse({ description: 'Unauthorized Request' })
  // @UseGuards(JWTAuthGuard)
  @Post('create')
  CreateNewSwap(@Body() dto): Promise<Swap> {
    return this.swapService.CreateNewSwap(dto);
  }

  @ApiOperation({
    summary:
      'Получение всех запросов на обмен для конкретного пользователя - только авторизованным',
  })
  @ApiResponse({
    status: 201,
  })
  @ApiUnprocessableEntityResponse({ description: 'Bad Request' })
  @ApiForbiddenResponse({ description: 'Unauthorized Request' })
  // @UseGuards(JWTAuthGuard)
  @Post('getById')
  GetAllSwapByUserId(@Body() dto: GetAllSwapByUserId): Promise<Swap[]> {
    return this.swapService.GetAllSwapByUserId(dto);
  }

  @ApiOperation({
    summary: 'Принятие/непринятие запроса на обмен - только авторизованным',
  })
  @ApiResponse({
    status: 201,
  })
  @ApiUnprocessableEntityResponse({ description: 'Bad Request' })
  @ApiForbiddenResponse({ description: 'Unauthorized Request' })
  // @UseGuards(JWTAuthGuard)
  @Post('swapResponse')
  SwapResponse(@Body() dto: AcceptDeclineSwap): Promise<boolean> {
    return dto.accept
      ? this.swapService.AcceptSwap(dto)
      : this.swapService.DeclineSwap(dto);
  }
}
