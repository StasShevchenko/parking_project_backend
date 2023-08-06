import {
	CanActivate,
	ExecutionContext,
	Injectable,
	UnauthorizedException,
} from '@nestjs/common'
import { AuthGuard } from '@nestjs/passport'
import { Observable } from 'rxjs'
import { TokenService } from 'src/modules/token/token.service'

@Injectable()
export class JWTAuthGuard implements CanActivate {
	constructor(private readonly jwtService: TokenService) {}

	canActivate(
		context: ExecutionContext,
	): boolean | Promise<boolean> | Observable<boolean> {
		const req = context.switchToHttp().getRequest()
		try {
			const authHeader = req.headers.authorization
			const bearer = authHeader.split(' ')[0]
			const token = authHeader.split(' ')[1]

			if (bearer !== 'Bearer' || !token) {
				throw new UnauthorizedException({
					message: 'Пользователь не авторизован',
				})
			}
			return this.jwtService
				.verifyAccessToken(token)
				.then((user) => {
					req.user = user.user

					return true
					// return user.role.some(role => requiredRoles.includes(role.value));
				})
				.catch((e) => {
					console.log(e)
					throw new UnauthorizedException({
						message: 'У пользователя недостаточно прав',
					})
				})

			return true
		} catch (e) {
			throw new UnauthorizedException({
				message: 'Пользователь не авторизован',
			})
		}
	}

	// constructor(private readonly jwtService: TokenService) {}

	// canActivate(context: ExecutionContext): boolean | Promise<boolean> | Observable<boolean> {
	//     const req = context.switchToHttp().getRequest()
	//     try{
	//         const authHeader = req.headers.authorization
	//         const bearer = authHeader.split(' ')[0]
	//         const token = authHeader.split(' ')[1]

	//         if(bearer !== 'Bearer' || !token) {
	//             throw new UnauthorizedException({message: "Пользователь не авторизован"})
	//         }
	//         const user = this.jwtService.verifyAccessToken(token)
	//         req.user = user

	//         return true
	//     } catch(e) {
	//         throw new UnauthorizedException({message: "Пользователь не авторизован"})
	//     }
	// }
}
