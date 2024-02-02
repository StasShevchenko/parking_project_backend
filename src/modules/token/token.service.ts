import {BadRequestException, HttpStatus, Injectable, NotFoundException, UnauthorizedException,} from '@nestjs/common';
import {JwtService} from '@nestjs/jwt';
import {CompleteRefreshTokenDto} from './dto';
import {InjectModel} from '@nestjs/sequelize';
import {User} from '../user/model/user.model';

@Injectable()
export class TokenService {
  @InjectModel(User) private readonly userRepository: typeof User;
  constructor(
    private readonly jwtService: JwtService,
  ) {}

  async generateAccessToken(user: User) {
    const payLoad = this.getUserJwtPayload(user);
    return this.jwtService.sign(payLoad, {
      secret: process.env.SECRET_KEY,
      expiresIn: '1h',
    });
  }

  async generateRefreshToken(user: User) {
    const payLoad = this.getUserJwtPayload(user)
    return this.jwtService.sign(payLoad, {
      secret: process.env.SECRET_REFRESH_KEY,
      expiresIn: '30d'
    });
  }

  async generateNewRefreshData(userData) {
    try {
      const user = await this.userRepository.findByPk(userData.id);
      return await this.generateRefreshToken(user);
    } catch (e) {
      console.log(e);
      throw new BadRequestException();
    }
  }

  async verifyAccessToken(token: string): Promise<any> {
    try {
      return this.jwtService.verify(token, {
        secret: process.env.SECRET_KEY,
      });
    } catch (error) {
      console.log(error);
      throw new BadRequestException('Invalid token');
    }
  }

  async verifyRefreshToken(token: string): Promise<any> {
    try {
      return this.jwtService.verify(token, {
        secret: process.env.SECRET_REFRESH_KEY,
      });
    } catch (error) {
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
      const NewRefresh = await this.generateNewRefreshData(userData);

      return { access: accessToken, refresh: NewRefresh };
    } catch (e) {
      if (e.status == 404) {
        throw new NotFoundException(HttpStatus.NOT_FOUND);
      }
      throw new BadRequestException('Invalid token');
    }
  }

  async checkUser(id: number): Promise<boolean> {
    try {
      const user = await this.userRepository.findByPk(id);
      if (user) {
        return true;
      }
      throw new NotFoundException(HttpStatus.NOT_FOUND);
    } catch (e) {
      throw new NotFoundException(HttpStatus.NOT_FOUND);
    }
  }

  private getUserJwtPayload(user: User){
    return {
      email: user.email,
      id: user.id,
      isAdmin: user.isAdmin,
      isSuperAdmin: user.isSuperAdmin,
      queueUser: user.queueUser,
      firstName: user.firstName,
      secondName: user.secondName,
      changedPassword: user.changedPassword,
      avatar: user.avatar,
    }
  }
}
