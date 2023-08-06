import { BadRequestException, Injectable } from '@nestjs/common';
import { TokenService } from '../token/token.service';
import { CreateUserDto } from '../user/dto';
import { UserService } from '../user/user.service';
import { AuthUserResponseDTO, LoginUserDTO } from './dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    private readonly tokenService: TokenService,
  ) {}

  async registerUsers(dto: CreateUserDto): Promise<CreateUserDto> {
    try {
      const existUser = await this.userService.findUserByEmail(dto.email);
      if (existUser) {
        throw new BadRequestException('USER EXIST');
      }
      const user = await this.userService.createUser(dto);
      return user;
    } catch (e) {
      console.log(e);
    }
  }

  async loginUser(dto: LoginUserDTO): Promise<AuthUserResponseDTO> {
    const existUser = await this.userService.findUserByEmail(dto.email);
    // console.log(existUser);
    if (!existUser) {
      throw new BadRequestException('USER EXIST');
    }
    const validatePassword = dto.password === existUser.password ? true : false;
    if (!validatePassword) {
      throw new BadRequestException('Wrong Data');
    }
    const userData = {
      email: existUser.email,
      id: existUser.id,
      is_staff: existUser.is_staff,
    };
    const jwtAccess = await this.tokenService.generateAccessToken(userData);
    const jwtRefresh = await this.tokenService.generateRefreshToken(userData);
    return { jwtAccess, jwtRefresh };
  }
}
