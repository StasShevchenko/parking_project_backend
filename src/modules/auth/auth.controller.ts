import { Body, Controller, Post } from '@nestjs/common';
import { ApiResponse, ApiTags } from '@nestjs/swagger';
import { CreateUserDto } from '../user/dto';
import { AuthService } from './auth.service';
import { AuthUserResponseDTO, LoginUserDTO } from './dto';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @ApiResponse({ status: 201, type: CreateUserDto })
  @Post('register')
  register(@Body() dto: CreateUserDto): Promise<CreateUserDto> {
    return this.authService.registerUsers(dto);
  }
  @ApiResponse({ status: 200, type: AuthUserResponseDTO })
  @Post('login')
  login(@Body() dto: LoginUserDTO): Promise<AuthUserResponseDTO> {
    return this.authService.loginUser(dto);
  }
}
