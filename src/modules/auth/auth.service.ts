import {BadRequestException, Injectable} from '@nestjs/common';
import {TokenService} from '../token/token.service';
import {CreateUserDto} from '../user/dto';
import {User} from '../user/model/user.model';
import {UserService} from '../user/user.service';
import {AuthUserResponseDTO, LoginUserDTO} from './dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    private readonly tokenService: TokenService,
  ) {}

  async registerUsers(dto: CreateUserDto): Promise<CreateUserDto> {
      const existUser = await this.userService.findUserByEmail(dto.email);
      if (existUser) {
        throw new BadRequestException('USER EXIST');
      }
    return await this.userService.createUser(dto);
  }

  async loginUser(dto: LoginUserDTO): Promise<AuthUserResponseDTO> {
    const existUser = await this.userService.findUserByEmail(dto.email);
    if (!existUser) {
      throw new BadRequestException({message: "USER EXISTS"});
    }
    const validatePassword = await this.userService.comparePassword(
      dto.password,
      existUser.password,
    );

    if (!validatePassword && dto.password != existUser.password) {
      throw new BadRequestException('Wrong Data');
    }
    const userData = {
      email: existUser.email,
      id: existUser.id,
      is_staff: existUser.is_staff,
      is_superuser: existUser.is_superuser,
      in_queue: existUser.in_queue,
      first_name: existUser.firstName,
      second_name: existUser.secondName,
      changePassword: existUser.changePassword,
      avatar: existUser.avatar,
    };
    const jwtAccess = await this.tokenService.generateAccessToken(userData);
    const jwtRefresh = await this.tokenService.generateRefreshToken(userData);
    return { jwtAccess, jwtRefresh };
  }

  async SendEmailRegistrations(user: User) {}
}
