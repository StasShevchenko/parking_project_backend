import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { TokenService } from '../token/token.service';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly tokenService: TokenService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredRole = this.reflector.get<string>(
      'roles',
      context.getHandler(),
    );
    if (!requiredRole) {
      // Если роль не указана, разрешаем доступ
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      // Если заголовок аутентификации отсутствует или не начинается с 'Bearer ', запрещаем доступ
      return false;
    }

    const token = authHeader.substring('Bearer '.length).trim();
    const user = await this.tokenService.verifyAccessToken(token);
    const is_staff = user.user.is_staff;
    console.log(is_staff);

    if (!user || !user.user[requiredRole]) {
      // Если пользователя не существует или у него нет требуемой роли, запрещаем доступ
      return false;
    }

    return true;
  }
}
