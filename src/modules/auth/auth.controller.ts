import {Body, Controller, Post, Req, Res, UseGuards} from '@nestjs/common';
import {
    ApiBearerAuth,
    ApiForbiddenResponse,
    ApiOperation,
    ApiResponse,
    ApiTags,
    ApiUnprocessableEntityResponse,
} from '@nestjs/swagger';
import {CreateUserDto} from '../user/dto/createUser.dto';
import {AuthService} from './auth.service';
import {LoginUserDto} from './dto/loginUser.dto';
import {JwtAuthGuard} from "./guards/jwtAuth.guard";
import {RolesGuard} from "./guards/roles.guard";
import {Roles} from "./decorators/hasRoles.decorator";
import {TokensDto} from "../token/dto/tokens.dto";
import {Public} from "./decorators/public.decorator";
import {Request, Response} from "express";

@ApiTags('auth')
@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService) {
    }

    @ApiOperation({summary: 'Регистрация пользователя - только админам'})
    @ApiResponse({
        status: 201,
        type: CreateUserDto,
    })
    @ApiBearerAuth()
    @ApiUnprocessableEntityResponse({description: 'Bad Request'})
    @ApiForbiddenResponse({description: 'Unauthorized Request'})
    @UseGuards(JwtAuthGuard)
    @UseGuards(RolesGuard)
    @Roles('isAdmin')
    @Post('register')
    register(@Body() dto: CreateUserDto): Promise<CreateUserDto> {
        return this.authService.registerUser(dto);
    }

    @ApiOperation({summary: 'Авторизация пользователя - всем'})
    @ApiResponse({
        status: 201,
        type: TokensDto,
    })
    @ApiUnprocessableEntityResponse({description: 'Bad Request'})
    @ApiForbiddenResponse({description: 'Unauthorized Request'})
    @Public()
    @Post('login')
    login(@Body() dto: LoginUserDto,
          @Req() request: Request,
          @Res({passthrough: true}) response: Response
    ): Promise<TokensDto> {
        return this.authService.loginUser(dto, request, response);
    }


    @ApiOperation({summary: 'Выход из личного кабинета'})
    @Post('logout')
    @UseGuards(JwtAuthGuard)
    logout(
        @Req() request: Request,
        @Res({passthrough: true}) response: Response
    ) {
        return this.authService.logoutUser(request, response)
    }
}
