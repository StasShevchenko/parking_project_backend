import {BadRequestException, HttpStatus, Injectable, NotFoundException, UnauthorizedException,} from '@nestjs/common';
import {JwtService} from '@nestjs/jwt';
import {InjectModel} from '@nestjs/sequelize';
import {User} from '../user/model/user.model';
import {TokensDto} from "./dto/tokens.dto";
import * as argon from 'argon2';
import {Token} from "../user/model/token.model";
import {ModelStatic} from "sequelize-typescript";
import {CreationAttributes, ModelAttributes} from "sequelize";
import {Request, Response} from "express";
import {CookiesKeys} from "../../utils/cookiesKeys";

@Injectable()
export class TokenService {
    @InjectModel(User) private readonly userRepository: typeof User;
    @InjectModel(Token) private readonly tokenRepository: typeof Token;

    constructor(
        private readonly jwtService: JwtService,
    ) {
    }

    async generateAccessToken(user: User) {
        const payLoad = this.getUserJwtPayload(user);
        return this.jwtService.sign(payLoad, {
            secret: process.env.SECRET_KEY,
            expiresIn: '1h',
        });
    }

    async deleteTokenById(tokenId: number) {
        await this.tokenRepository.destroy({
            where: {id: tokenId}
        })
    }

    async createToken(token: CreationAttributes<Token>) {
        return await this.tokenRepository.create(token)
    }

    async generateRefreshToken(user: User) {
        const payLoad = this.getUserJwtPayload(user)
        return this.jwtService.sign(payLoad, {
            secret: process.env.SECRET_REFRESH_KEY,
            expiresIn: '30d'
        });
    }

    async verifyRefreshToken(token: string): Promise<any> {
        try {
            return this.jwtService.verify(token, {
                secret: process.env.SECRET_REFRESH_KEY,
            });
        } catch (error) {
            throw new UnauthorizedException({
                message: 'Invalid token',
                status: 401,
            });
        }
    }

    async refreshToken(request: Request, response: Response): Promise<TokensDto> {
        try {
            const refresh = request.cookies?.[CookiesKeys.RefreshToken]
            console.log(`Someone trying to refresh: ${new Date()} ${refresh}`)
            const refreshTokenKey = request.cookies?.[CookiesKeys.RefreshTokenKey]

            const userData = (await this.verifyRefreshToken(refresh)).user;
            const user = await this.userRepository.findByPk(userData.id, {include: {model: Token}})

            const refreshToken = user.tokens.find((token) => token.id === parseInt(refreshTokenKey))

            const isRefreshValid = await argon.verify(refreshToken.token, refresh)
            if (isRefreshValid) {
                const accessToken = await this.generateAccessToken(user);
                const newRefreshToken = await this.generateRefreshToken(user);
                const expiresDate = new Date();
                expiresDate.setMonth(expiresDate.getMonth() + 1);
                const env = process.env.NODE_ENV
                response.cookie(CookiesKeys.RefreshToken, newRefreshToken, {
                    httpOnly: true,
                    sameSite: env === "development" ? true : 'none',
                    secure: env !== "development",
                    expires: expiresDate
                });
                refreshToken.token = await argon.hash(newRefreshToken)
                await refreshToken.save()
                return {accessToken}
            } else {
                throw new BadRequestException()
            }
        } catch (e) {
            throw new BadRequestException('Invalid token');
        }
    }

    private getUserJwtPayload(user: User) {
        return {
            user: {
                email: user.email,
                id: user.id,
                isAdmin: user.isAdmin,
                isSuperAdmin: user.isSuperAdmin,
                queueUser: user.queueUser,
                firstName: user.firstName,
                secondName: user.secondName,
                changedPassword: user.changedPassword,
                avatar: user.avatar,
                active: user.active
            }
        }
    }
}
