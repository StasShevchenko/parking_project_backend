import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { TokenService } from '../token/token.service';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
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
    const {user} = request

    return user.user[requiredRole];

  }
}
