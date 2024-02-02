import {Injectable, UnauthorizedException} from "@nestjs/common";
import {PassportStrategy} from "@nestjs/passport";
import {UserService} from "../../user/user.service";
import {ExtractJwt} from "passport-jwt";
import {Strategy} from "passport";

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
    constructor(private usersService: UserService) {
        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            secretOrKey: process.env.SECRET_KEY,
            ignoreExpiration: false
        });
    }

    async validate(payload: { userId: number }) {
        const user = await this.usersService.findUserById(payload.userId);
        if (!user) {
            throw new UnauthorizedException();
        }
        return user;
    }
}