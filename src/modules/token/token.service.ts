import {
  BadRequestException,
  HttpException,
  HttpStatus,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { CompleteRefreshTokenDto } from './dto';
import { UserService } from '../user/user.service';
import { NotFoundError } from 'rxjs';
import { InjectModel } from '@nestjs/sequelize';
import { User } from '../user/model/user.model';

@Injectable()
export class TokenService {
  @InjectModel(User) private readonly userRepository: typeof User;
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async generateAccessToken(user) {
    const payLoad = { user };
    const accessToken = this.jwtService.sign(payLoad, {
      secret: process.env.SECRET_KEY,
      expiresIn: '1h',
    });

    return accessToken;
  }

  async generateRefreshToken(user) {
    const payLoad = { user };
    const refreshToken = await this.jwtService.sign(payLoad, {
      secret: process.env.SECRET_REFRESH_KEY,
      expiresIn: '30d',
    });

    return refreshToken;
  }

  async verifyAccessToken(token: string): Promise<any> {
    try {
      const decoded = this.jwtService.verify(token, {
        secret: process.env.SECRET_KEY,
      });
      console.log(decoded);
      return decoded;
    } catch (error) {
      console.log(error);
      throw new BadRequestException('Invalid token');
    }
  }

  async verifyRefreshToken(token: string): Promise<any> {
    try {
      const decoded = this.jwtService.verify(token, {
        secret: process.env.SECRET_REFRESH_KEY,
      });

      return decoded;
    } catch (error) {
      console.log(error);
      throw new UnauthorizedException({
        message: 'Invalid token',
        status: 401,
      });
    }
  }

  async refreshToken(refresh: string): Promise<CompleteRefreshTokenDto> {
    try {
      const decode = await this.verifyRefreshToken(refresh);
      const userData = decode.user;
      const user: boolean = await this.checkUser(userData.id);
      const accessToken = await this.generateAccessToken(userData);

      return { access: accessToken };
    } catch (e) {
      if (e.status == 404) {
        throw new NotFoundException(HttpStatus.NOT_FOUND);
      }
      throw new BadRequestException('Invalid token');
    }
  }

  async checkUser(id: number): Promise<boolean> {
    try{
      const user = await this.userRepository.findByPk(id);
      if (user) {
        return true
      } 
      throw new NotFoundException(HttpStatus.NOT_FOUND);
    }catch(e) {
      throw new NotFoundException(HttpStatus.NOT_FOUND);
    }
  }
}
