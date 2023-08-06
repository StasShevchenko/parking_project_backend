import { Module } from '@nestjs/common';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { TokenController } from './token.controller';
import { TokenService } from './token.service';

@Module({
  imports: [
    JwtModule.register({
      secret: process.env.SECRET_KEY,
    }),
  ],
  providers: [TokenService, JwtService],
  controllers: [TokenController],
  exports: [TokenService],
})
export class TokenModule {}
