import { Body, Controller, Post } from '@nestjs/common';
import {
  ApiForbiddenResponse,
  ApiOperation,
  ApiResponse,
  ApiTags,
  ApiUnprocessableEntityResponse,
} from '@nestjs/swagger';
import { AcceptDeclineSwapDto } from './dto/acceptDeclineSwapDto';
import { GetAllSwapByUserId } from './dto/get_swap_by_userId.dto';
import { Swap } from './model/swap.model';
import { SwapService } from './swap.service';
import {CreateSwapRequestDto} from "./dto/createSwapRequest.dto";

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
  @Post('create')
  createNewSwapRequest(@Body() dto: CreateSwapRequestDto): Promise<Swap> {
    return this.swapService.createNewSwapRequest(dto);
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
  @Post('swapResponse')
  SwapResponse(@Body() dto: AcceptDeclineSwapDto): Promise<boolean> {
    return dto.accept
      ? this.swapService.AcceptSwap(dto)
      : this.swapService.DeclineSwap(dto);
  }
}
