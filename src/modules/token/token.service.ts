import {BadRequestException, HttpStatus, Injectable, NotFoundException, UnauthorizedException,} from '@nestjs/common';
import {JwtService} from '@nestjs/jwt';
import {InjectModel} from '@nestjs/sequelize';
import {User} from '../user/model/user.model';
import {TokensDto} from "./dto/tokens.dto";
import * as argon from 'argon2';

@Injectable()
export class TokenService {
    @InjectModel(User) private readonly userRepository: typeof User;

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

    async refreshToken(refresh: string): Promise<TokensDto> {
        try {
            const userData = (await this.verifyRefreshToken(refresh)).user;
            const user = await this.userRepository.findByPk(userData.id)
            const isRefreshValid = await argon.verify(user.refreshToken, refresh)
            if (isRefreshValid) {
                const accessToken = await this.generateAccessToken(user);
                const refreshToken = await this.generateRefreshToken(user);
                user.refreshToken = await argon.hash(refreshToken)
                await user.save()
                return {accessToken, refreshToken}
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
            }
        }
    }
}
