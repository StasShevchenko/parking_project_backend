import { Body, Controller, Post } from '@nestjs/common';
import {
  ApiOperation,
  ApiResponse,
  ApiTags,
  ApiUnprocessableEntityResponse,
} from '@nestjs/swagger';
import { TokenService } from './token.service';
import {TokensDto} from "./dto/tokens.dto";
import {RefreshTokenDto} from "./dto/refreshToken.dto";
import {Public} from "../auth/public.decorator";

@ApiTags('Token')
@Controller('token')
export class TokenController {
  constructor(private readonly tokenService: TokenService) {}

  @ApiOperation({ summary: 'Refresh Token' })
  @ApiResponse({
    status: 201,
    type: TokensDto,
  })
  @ApiUnprocessableEntityResponse({ description: 'Bad Request' })
  @Public()
  @Post('refresh')
  refreshToken(@Body() dto: RefreshTokenDto): Promise<TokensDto> {
    return this.tokenService.refreshToken(dto.refresh);
  }
}
