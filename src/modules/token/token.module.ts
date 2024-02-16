import {Module} from '@nestjs/common';
import {JwtModule, JwtService} from '@nestjs/jwt';
import {TokenController} from './token.controller';
import {TokenService} from './token.service';
import {SequelizeModule} from '@nestjs/sequelize';
import {User} from '../user/model/user.model';
import {Token} from "../user/model/token.model";

@Module({
    imports: [
        JwtModule.register({
            secret: process.env.SECRET_KEY,
        }),
        SequelizeModule.forFeature([User, Token]),
    ],
    providers: [TokenService, JwtService],
    controllers: [TokenController],
    exports: [TokenService],
})
export class TokenModule {
}
