import {BadRequestException, Injectable} from '@nestjs/common';
import {TokenService} from '../token/token.service';
import {CreateUserDto} from '../user/dto/createUser.dto';
import {UserService} from '../user/user.service';
import {LoginUserDto} from './dto/loginUser.dto';
import * as argon from 'argon2';
import {TokensDto} from "../token/dto/tokens.dto";
import {Request, Response} from "express";
import {CookiesKeys} from "../../utils/cookiesKeys";

@Injectable()
export class AuthService {
    constructor(
        private readonly userService: UserService,
        private readonly tokenService: TokenService,
    ) {
    }

    async registerUser(dto: CreateUserDto): Promise<CreateUserDto> {
        const existUser = await this.userService.findUserByEmail(dto.email);
        if (existUser) {
            throw new BadRequestException('USER EXIST');
        }
        return await this.userService.createUser(dto);
    }

    async loginUser(dto: LoginUserDto,
                    request: Request,
                    response: Response): Promise<TokensDto> {
        try {
            const user = await this.userService.findUserByEmail(dto.email);
            if (!user) {
                throw new BadRequestException({message: 'Wrong email'});
            }
            const existingRefreshTokenKey = request.cookies?.[CookiesKeys.RefreshTokenKey];
            if (existingRefreshTokenKey) {
                await this.tokenService.deleteTokenById(parseInt(existingRefreshTokenKey))
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
            const hashedToken = await argon.hash(jwtRefresh);

            const refreshToken = await this.tokenService.createToken({
                token: hashedToken,
                userId: user.id
            });
            const expiresDate = new Date();
            expiresDate.setMonth(expiresDate.getMonth() + 1);

            response.cookie(CookiesKeys.RefreshTokenKey, refreshToken.id, {
                httpOnly: true,
                sameSite: true,
                expires: expiresDate
            });
            response.cookie(CookiesKeys.RefreshToken, jwtRefresh, {
                httpOnly: true,
                sameSite: true,
                expires: expiresDate
            });

            await user.save();

            return {accessToken: jwtAccess};
        } catch (e){
            console.log(e)
        }
    }

    async logoutUser(request: Request) {
        const refreshTokenKey = request.cookies?.[CookiesKeys.RefreshTokenKey]
        await this.tokenService.deleteTokenById(parseInt(refreshTokenKey))
    }
}
