import { Module, forwardRef } from '@nestjs/common';
import { TokenModule } from '../token/token.module';
import { UserModule } from '../user/user.module';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
// import { UsersService } from '../users/users.service';
import { JwtModule } from '@nestjs/jwt';
import { JWTStrategy } from 'src/strategy';
import { RolesGuard } from './roles.guard';

@Module({
  imports: [forwardRef(() => UserModule), TokenModule, JwtModule],
  controllers: [AuthController],
  providers: [AuthService, JWTStrategy, RolesGuard],
  exports: [AuthModule],
})
export class AuthModule {}
