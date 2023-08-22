import { Body, Controller, Post } from '@nestjs/common';
import {
  ApiOperation,
  ApiResponse,
  ApiTags,
  ApiUnprocessableEntityResponse,
} from '@nestjs/swagger';
import { CompleteRefreshTokenDto, RefreshTokenDto } from './dto';
import { TokenService } from './token.service';

@ApiTags('Token')
@Controller('token')
export class TokenController {
  constructor(private readonly tokenService: TokenService) {}

  @ApiOperation({ summary: 'Refresh Token' })
  @ApiResponse({
    status: 201,
    type: CompleteRefreshTokenDto,
  })
  @ApiUnprocessableEntityResponse({ description: 'Bad Request' })
  @Post('refresh')
  refreshToken(@Body() dto: RefreshTokenDto): Promise<CompleteRefreshTokenDto> {
    console.log('Refresh in controller: ', dto);
    return this.tokenService.refreshToken(dto.refresh);
  }
}
