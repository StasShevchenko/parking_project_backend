import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import * as bcrypt from 'bcrypt';
import { Op } from 'sequelize';
import * as uuid from 'uuid';
import { MailService } from '../mail/mail.service';
import { MailKeyService } from '../mail_key/mail_key.service';
import { QueueService } from '../queue/queue.service';
import { CreateUserDto } from './dto';
import { changePasswordDto } from './dto/changePassword.dto';
import { ForgotPasswordDto } from './dto/forgot_password.dto';
import { MailKeyReviewDto } from './dto/mail_key_review.dto';
import { UpdateAllUserDataDto } from './dto/update.all_user_data';
import { User } from './model/user.model';

@Injectable()
export class UserService {
  @InjectModel(User) private readonly userRepository: typeof User;
  constructor(
    private readonly queueService: QueueService,
    private readonly mailService: MailService,
    private readonly mailKeyService: MailKeyService,
  ) {}

  async findUserByEmail(email: string) {
    return await this.userRepository.findOne({ where: { email } });
  }

  uniqueKey() {
    let pass = uuid.v4().substring(0, 8);
    return pass;
  }

  async hashPassword(password) {
    return bcrypt.hash(password, 10);
  }

  async createUser(dto: CreateUserDto): Promise<CreateUserDto> {
    try {
      const validate = await this.findUserByEmail(dto.email);
      if (validate) {
        throw new BadRequestException('User with this email exist');
      }

      const key = this.uniqueKey().substring(0, 8);
      const password = await this.hashPassword(key);
      const newUser = await this.userRepository.create({
        ...dto,
        password: password,
      });
      if (dto.in_queue) {
        const user = await this.findUserByEmail(dto.email);
        const userId = {
          userId: user.id,
        };
        await this.queueService.create(userId);
      }
      await this.mailService.sendRegistrationsEmail(newUser, key);
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

  async getAdminsList(): Promise<User[]> {
    return await this.userRepository.findAll({
      where: { is_staff: true },
      attributes: {
        exclude: [
          'password',
          'createdAt',
          'updatedAt',
          'start_active_time',
          'end_active_time',
          'last_active_period',
        ],
      },
    });
  }

  async getUserById(id: number): Promise<User> {
    try {
      const user = await this.userRepository.findOne({
        where: { id },
        attributes: { exclude: ['password', 'createdAt', 'updatedAt'] },
      });
      if (user.active || !user.in_queue) {
        return user;
      } else {
        const start_time = await this.queueService.nextPeriodNoActiveUser(user);
        user.start_active_time = start_time.start_active_time;
        user.end_active_time = start_time.end_active_time;

        return user;
      }
    } catch (e) {
      console.log(e);
      throw new BadRequestException({ status: 401 });
    }
  }

  async updateUser(
    id: number,
    dto: UpdateAllUserDataDto,
  ): Promise<UpdateAllUserDataDto> {
    const user = await this.userRepository.update(dto, { where: { id } });
    return dto;
  }

  async deleteUserById(id): Promise<number> {
    const user = await this.userRepository.findOne({ where: { id } });
    if (user.is_staff) {
      throw new BadRequestException('Поьзователь является администратором');
    }
    const deleteUser = await this.userRepository.destroy({ where: { id } });
    await this.queueService.deleteFromQueue(id);
    return deleteUser;
  }

  async deleteAdminById(id): Promise<number> {
    try {
      await this.queueService.deleteFromQueue(id);
      return await this.userRepository.destroy({ where: { id } });
    } catch (e) {
      throw new BadRequestException();
    }
  }

  async comparePassword(
    password1: string,
    password2: string,
  ): Promise<boolean> {
    return bcrypt.compare(password1, password2);
  }

  PasswordValidation(password: string) {
    const Validationpassword = password.trim();
    const containsLetters = /^.*[a-zA-Z]+.*$/;
    const minimum8Chars = /^.{8,}$/;
    const withoutSpaces = /^\S+$/;

    if (
      minimum8Chars.test(Validationpassword) &&
      withoutSpaces.test(Validationpassword) &&
      containsLetters.test(Validationpassword)
    ) {
      return true;
    } else {
      return false;
    }
  }

  async changePassword(dto: changePasswordDto): Promise<boolean> {
    const user = await this.userRepository.findOne({
      where: { email: dto.email },
    });
    if (dto.newPassword == dto.repeat_newPassword) {
      if (this.PasswordValidation(dto.newPassword)) {
        const hashPassword = await this.hashPassword(dto.newPassword);
        user.password = hashPassword;
        user.changePassword = true;
        await user.save();
        return true;
      } else {
        throw new BadRequestException({ messange: 'Простой пароль' });
      }
    } else {
      throw new BadRequestException('Wrong Data');
    }
  }

  async getUsersByRolesTest(
    roles: string[],
    firstName: string,
    secondName: string,
  ) {
    try {
      let rolesFilter = [];
      console.log(roles);
      if (roles.includes('user')) {
        rolesFilter.push({ in_queue: true });
      }
      if (roles.includes('admin')) {
        rolesFilter.push({ is_staff: true });
      }
      if (roles.includes('super_admin')) {
        rolesFilter.push({ is_superuser: true });
      }
      let users = await this.userRepository.findAll({
        where: {
          [Op.or]: rolesFilter,
        },
        attributes: { exclude: ['password', 'createdAt', 'updatedAt'] },
      });
      if (users.length < 1) {
        throw new BadRequestException();
      }
      if (firstName) {
        users = await this.getUsersByNameAndRole(firstName, secondName, users);
      }
      return users;
    } catch (e) {}
  }

  getUsersByNameAndRole(firstName: string, secondName: string, users) {
    firstName = firstName.toLowerCase();
    if (secondName) {
      secondName = secondName.toLowerCase();
    }

    const filteredUsers = users.filter(
      (user) =>
        user.firstName.toLowerCase().includes(firstName) ||
        user.secondName.toLowerCase().includes(secondName) ||
        user.secondName.toLowerCase().includes(firstName),
    );

    return filteredUsers;
  }

  async getUsersByName(firstName: string, secondName: string) {
    const users = await this.userRepository.findAll({
      attributes: {
        exclude: ['password', 'createdAt', 'updatedAt'],
      },
    });
    firstName = firstName.toLowerCase();
    if (secondName) {
      secondName = secondName.toLowerCase();
    }

    const filteredUsers = users.filter(
      (user) =>
        user.firstName.toLowerCase().includes(firstName) ||
        user.secondName.toLowerCase().includes(secondName) ||
        user.secondName.toLowerCase().includes(firstName),
    );

    return filteredUsers;
  }

  async getAdminRole(id: number): Promise<User> {
    try {
      let user = await this.userRepository.findByPk(id);
      user.is_staff = true;
      await user.save();
      return user;
    } catch (e) {
      throw new BadRequestException({ status: 401 });
    }
  }

  async deleteAdminRole(id: number): Promise<User> {
    try {
      let user = await this.userRepository.findByPk(id);
      user.is_staff = false;
      await user.save();
      return user;
    } catch (e) {
      throw new BadRequestException({ status: 401 });
    }
  }

  async forgotPasswordMailKey(dto: ForgotPasswordDto): Promise<Boolean> {
    try {
      const user = await this.findUserByEmail(dto.email);
      if (user) {
        await this.mailKeyService.generateMailKey(user);
        return true;
      }
      throw new BadRequestException({ status: 401 });
    } catch (e) {
      throw new BadRequestException({ status: 401 });
    }
  }

  async KeyReview(dto: MailKeyReviewDto): Promise<String> {
    try {
      const DBkey = await this.mailKeyService.KeyReview(dto.key);
      if (DBkey) {
        return DBkey.email;
      }
    } catch (e) {
      throw new BadRequestException();
    }
  }
}
