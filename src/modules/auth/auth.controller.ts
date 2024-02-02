import {Body, Controller, Post, UseGuards} from '@nestjs/common';
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
import {LoginUserResponseDto} from "./dto/loginUserResponse.dto";

@ApiBearerAuth()
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
    @ApiUnprocessableEntityResponse({description: 'Bad Request'})
    @ApiForbiddenResponse({description: 'Unauthorized Request'})
    @UseGuards(RolesGuard)
    @Roles('is_staff')
    @Post('register')
    register(@Body() dto: CreateUserDto): Promise<CreateUserDto> {
        return this.authService.registerUsers(dto);
    }

    @ApiOperation({summary: 'Авторизация пользователя - всем'})
    @ApiResponse({
        status: 201,
        type: LoginUserResponseDto,
    })
    @ApiUnprocessableEntityResponse({description: 'Bad Request'})
    @ApiForbiddenResponse({description: 'Unauthorized Request'})
    @Post('login')
    login(@Body() dto: LoginUserDto): Promise<LoginUserResponseDto> {
        return this.authService.loginUser(dto);
    }
}
