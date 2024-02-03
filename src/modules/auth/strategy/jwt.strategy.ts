import {Injectable, UnauthorizedException} from "@nestjs/common";
import {PassportStrategy} from "@nestjs/passport";
import {UserService} from "../../user/user.service";
import {ExtractJwt, Strategy} from "passport-jwt";

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
    constructor(private usersService: UserService) {
        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            secretOrKey: process.env.SECRET_KEY,
            ignoreExpiration: false
        });
    }

    async validate(payload: { user }) {
        const user = await this.usersService.findUserById(payload.user.id);
        if (!user) {
            throw new UnauthorizedException();
        }
        return user;
    }
}