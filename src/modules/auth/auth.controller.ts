import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiForbiddenResponse,
  ApiOperation,
  ApiResponse,
  ApiTags,
  ApiUnprocessableEntityResponse,
} from '@nestjs/swagger';
import { CreateAdminDto, CreateUserDto } from '../user/dto';
import { AuthService } from './auth.service';
import { AuthUserResponseDTO, LoginUserDTO } from './dto';
import { Roles } from './has-roles.decorator';
import { RolesGuard } from './roles.guard';

@ApiBearerAuth()
@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @ApiOperation({ summary: 'Регистрация пользователя - только админам' })
  @ApiResponse({
    status: 201,
    type: CreateUserDto,
  })
  @ApiUnprocessableEntityResponse({ description: 'Bad Request' })
  @ApiForbiddenResponse({ description: 'Unauthorized Request' })
  @UseGuards(RolesGuard)
  @Roles('is_staff')
  @Post('register')
  register(@Body() dto: CreateUserDto): Promise<CreateUserDto> {
    return this.authService.registerUsers(dto);
  }

  @ApiOperation({ summary: 'Авторизация пользователя - всем' })
  @ApiResponse({
    status: 201,
    type: AuthUserResponseDTO,
  })
  @ApiUnprocessableEntityResponse({ description: 'Bad Request' })
  @ApiForbiddenResponse({ description: 'Unauthorized Request' })
  @Post('login')
  login(@Body() dto: LoginUserDTO): Promise<AuthUserResponseDTO> {
    return this.authService.loginUser(dto);
  }
}
