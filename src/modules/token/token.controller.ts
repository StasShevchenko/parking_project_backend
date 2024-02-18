import {Body, Controller, Post, Req, Res} from '@nestjs/common';
import {
    ApiOperation,
    ApiResponse,
    ApiTags,
    ApiUnprocessableEntityResponse,
} from '@nestjs/swagger';
import {TokenService} from './token.service';
import {TokensDto} from "./dto/tokens.dto";
import {RefreshTokenDto} from "./dto/refreshToken.dto";
import {Public} from "../auth/decorators/public.decorator";
import {Request, Response} from "express";

@ApiTags('Token')
@Controller('token')
export class TokenController {
    constructor(private readonly tokenService: TokenService) {
    }

    @ApiOperation({summary: 'Refresh Token'})
    @ApiResponse({
        status: 201,
        type: TokensDto,
    })
    @ApiUnprocessableEntityResponse({description: 'Bad Request'})
    @Public()
    @Post('refresh')
    refreshToken(
        @Req() request: Request,
        @Res({passthrough: true}) response: Response
    ): Promise<TokensDto> {
        return this.tokenService.refreshToken(request, response);
    }
}
