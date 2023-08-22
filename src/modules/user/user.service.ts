import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import * as bcrypt from 'bcrypt';
import * as uuid from 'uuid';
import { CreateUserDto } from './dto';
import { changePasswordDto } from './dto/changePassword.dto';
import { UpdateAllUserDataDto } from './dto/update.all_user_data';
import { User } from './model/user.model';

@Injectable()
export class UserService {
  @InjectModel(User) private readonly userRepository: typeof User;

  async findUserByEmail(email: string) {
    return await this.userRepository.findOne({ where: { email } });
  }

  uniqueKey() {
    let pass = uuid.v4().substring(0, 5);
    return pass;
  }

  async hashPassword(password) {
    return bcrypt.hash(password, 10);
  }

  async createUser(dto: CreateUserDto): Promise<CreateUserDto> {
    const validate = await this.findUserByEmail(dto.email);
    if (validate) {
      throw new BadRequestException('User with this email exist');
    }
    try {
      const key = this.uniqueKey();
      const password = await this.hashPassword(key.substring(0, 5));
      const newUser = await this.userRepository.create({
        ...dto,
        password: password,
      });
    } catch (e) {
      console.log(e);
      throw new BadRequestException('Bad request');
    }

    return dto;
  }

  async getAllUsers(): Promise<User[]> {
    return await this.userRepository.findAll({
      attributes: { exclude: ['password', 'createdAt', 'updatedAt'] },
    });
  }

  async getUserById(id: number): Promise<User> {
    return await this.userRepository.findOne({
      where: { id },
      attributes: { exclude: ['password', 'createdAt', 'updatedAt'] },
    });
  }

  async updateUser(
    id: number,
    dto: UpdateAllUserDataDto,
  ): Promise<UpdateAllUserDataDto> {
    const user = await this.userRepository.update(dto, { where: { id } });
    return dto;
  }

  async deleteUserById(id): Promise<number> {
    return await this.userRepository.destroy({ where: { id } });
  }

  async comparePassword(
    password1: string,
    password2: string,
  ): Promise<boolean> {
    return bcrypt.compare(password1, password2);
  }

  async changePassword(
    dto: changePasswordDto,
    userId: number,
  ): Promise<boolean> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });
    const comparePasswords = this.comparePassword(
      dto.oldPassword,
      user.password,
    );
    if (comparePasswords || dto.oldPassword == user.password) {
      const hashPassword = await this.hashPassword(dto.newPassword);
      user.password = hashPassword;
      await user.save();
      return true;
    } else {
      throw new BadRequestException('Wrong Data');
    }
  }
}
