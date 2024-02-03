import {Body, Controller, Post, Req, UseGuards} from '@nestjs/common';
import {
    ApiBearerAuth,
    ApiForbiddenResponse,
    ApiOperation,
    ApiResponse,
    ApiTags,
    ApiUnprocessableEntityResponse,
} from '@nestjs/swagger';
import {CreateUserDto} from '../user/dto';
import {AuthService} from './auth.service';
import {LoginUserDto} from './dto/loginUser.dto';
import {Roles} from './hasRoles.decorator';
import {RolesGuard} from './roles.guard';
import {TokensDto} from "../token/dto/tokens.dto";
import {JwtAuthGuard} from "./jwtAuth.guard";
import {Public} from "./public.decorator";

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
    @Roles('is_staff')
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
    login(@Body() dto: LoginUserDto): Promise<TokensDto> {
        return this.authService.loginUser(dto);
    }


    @ApiOperation({summary: 'Выход из личного кабинета'})
    @Post('logout')
    @UseGuards(JwtAuthGuard)
    logout(
        @Req() request
    ){
        return this.authService.logoutUser(request.user.id)
    }
}
