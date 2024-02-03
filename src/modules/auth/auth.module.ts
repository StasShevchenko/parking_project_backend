import {Module, forwardRef} from '@nestjs/common';
import {JwtModule} from '@nestjs/jwt';
import {TokenModule} from '../token/token.module';
import {UserModule} from '../user/user.module';
import {AuthController} from './auth.controller';
import {AuthService} from './auth.service';
import {RolesGuard} from './roles.guard';
import {JwtStrategy} from "./strategy/jwt.strategy";
import {JwtAuthGuard} from "./jwtAuth.guard";
import {APP_GUARD} from "@nestjs/core";

@Module({
    imports: [forwardRef(() => UserModule), TokenModule, JwtModule],
    controllers: [AuthController],
    providers: [
        {
            provide: APP_GUARD,
            useClass: JwtAuthGuard
        },
        AuthService, JwtStrategy, RolesGuard, JwtAuthGuard],
    exports: [AuthModule],
})
export class AuthModule {
}
