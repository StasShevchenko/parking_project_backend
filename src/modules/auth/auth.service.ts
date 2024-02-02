import {BadRequestException, Injectable} from '@nestjs/common';
import {TokenService} from '../token/token.service';
import {CreateUserDto} from '../user/dto';
import {UserService} from '../user/user.service';
import {LoginUserDto} from './dto/loginUser.dto';
import {LoginUserResponseDto} from "./dto/loginUserResponse.dto";

@Injectable()
export class AuthService {
    constructor(
        private readonly userService: UserService,
        private readonly tokenService: TokenService,
    ) {
    }

    async registerUsers(dto: CreateUserDto): Promise<CreateUserDto> {
        const existUser = await this.userService.findUserByEmail(dto.email);
        if (existUser) {
            throw new BadRequestException('USER EXIST');
        }
        return await this.userService.createUser(dto);
    }

    async loginUser(dto: LoginUserDto): Promise<LoginUserResponseDto> {
        const user = await this.userService.findUserByEmail(dto.email);
        if (!user) {
            throw new BadRequestException({message: 'Wrong email'});
        }
        const validatePassword = await this.userService.comparePassword(
            dto.password,
            user.password,
        );

        if (!validatePassword && dto.password != user.password) {
            throw new BadRequestException('Wrong Data');
        }

        const jwtAccess = await this.tokenService.generateAccessToken(user);
        const jwtRefresh = await this.tokenService.generateRefreshToken(user);
        return {jwtAccess, jwtRefresh};
    }

}
