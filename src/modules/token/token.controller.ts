import { Body, Controller, Post } from '@nestjs/common';
import { CompliteRefreshTokenDto, RefreshTokenDto } from './dto';
import { TokenService } from './token.service';

@Controller('token')
export class TokenController {
  constructor(private readonly tokenService: TokenService) {}

  @Post('refresh')
  refreshToken(@Body() dto: RefreshTokenDto): Promise<CompliteRefreshTokenDto> {
    console.log('Refresh in controller: ', dto);
    return this.tokenService.refreshToken(dto.refresh);
  }
}
