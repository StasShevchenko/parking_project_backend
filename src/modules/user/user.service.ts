import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import * as bcrypt from 'bcrypt';
import { Op } from 'sequelize';
import * as uuid from 'uuid';
import { AvatarService } from '../avatar/avatar.service';
import { MailService } from '../mail/mail.service';
import { MailKeyService } from '../mail_key/mail_key.service';
import { QueueService } from '../queue/queue.service';
import { CreateUserDto } from './dto';
import { ChangeAvatarDto } from './dto/changeAvatar.dto';
import {
  PasswordForgotChangeDto,
  changePasswordFromProfileDto,
} from './dto/changePassword.dto';
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
    private readonly avatarServcice: AvatarService,
  ) {}

  async findUserByEmail(email: string) {
    return await this.userRepository.findOne({ where: { email } });
  }

  async findUserById(id: number) {
    return await this.userRepository.findByPk(id);
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
      const avatar = this.avatarServcice.getAvatarToRegistrationUser();
      const key = this.uniqueKey().substring(0, 8);
      const password = await this.hashPassword(key);
      const newUser = await this.userRepository.create({
        firstName: dto.firstName,
        secondName: dto.secondName,
        email: dto.email,
        password: password,
        avatar: avatar,
      });
      if (dto.in_queue) {
        const user = await this.findUserByEmail(dto.email);
        const nowDate = new Date();
        const userId = {
          userId: user.id,
        };
        user.last_active_period = nowDate;
        await user.save();
        await this.queueService.AddUserToQueue(userId);
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

  async getUserById(id: number) {
    try {
      const user = await this.userRepository.findOne({
        where: { id },
        attributes: { exclude: ['password', 'createdAt', 'updatedAt'] },
      });
      // let nextUserData;
      // let previousUserData;
      // if (user.next_active) {
      //   const NextUser = await this.userRepository.findByPk(user.next_active);
      //   nextUserData = {
      //     firstName: NextUser.firstName,
      //     secondName: NextUser.secondName,
      //     email: NextUser.email,
      //   };
      // }
      // if (user.previous_active) {
      //   const PreviousUser = await this.userRepository.findByPk(
      //     user.previous_active,
      //   );
      //   previousUserData = {
      //     firstName: PreviousUser.firstName,
      //     secondName: PreviousUser.secondName,
      //     email: PreviousUser.email,
      //   };
      // }

      // if (user.active || !user.in_queue) {
      //   return { ...user.toJSON(), nextUserData, previousUserData };
      // } else {
      //   const start_time = await this.queueService.nextPeriodNoActiveUser(user);
      //   user.start_active_time = start_time.start_active_time;
      //   user.end_active_time = start_time.end_active_time;

      //   return { ...user.toJSON(), nextUserData, previousUserData };
      return user;
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

  async changePasswordFromProfile(
    dto: changePasswordFromProfileDto,
    email: string,
  ): Promise<boolean> {
    try {
      const user = await this.userRepository.findOne({
        where: { email: email },
      });
      const compareOldPassword = await this.comparePassword(
        dto.oldPassword,
        user.password,
      );
      if (!compareOldPassword || dto.newPassword != dto.repeat_newPassword) {
        throw new BadRequestException('Wrong Data');
      }
      if (this.PasswordValidation(dto.newPassword)) {
        const hashPassword = await this.hashPassword(dto.newPassword);
        user.password = hashPassword;
        user.changePassword = true;
        await user.save();
        return true;
      } else {
        throw new BadRequestException({ messange: 'Простой пароль' });
      }
    } catch (e) {
      throw new BadRequestException();
    }
  }

  async ForgotPasswordChange(dto: PasswordForgotChangeDto): Promise<boolean> {
    try {
      const mailKey = await this.KeyReview({ key: dto.key });
      const user = await this.userRepository.findOne({
        where: { email: mailKey },
      });
      if (!user) {
        throw new BadRequestException({ message: 'USER EXIST' });
      }
      await this.mailKeyService.deleteByKey(dto.key);
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
        throw new BadRequestException({ message: 'USER EXIST' });
      }
    } catch (e) {
      console.log(e);
      throw new BadRequestException();
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
      console.log(e);
      throw new BadRequestException();
    }
  }

  async changeAvatar(dto: ChangeAvatarDto, userId: number): Promise<Boolean> {
    try {
      const user: User = await this.userRepository.findByPk(userId);
      user.avatar = dto.avatarName;
      await user.save();
      console.log(user);
      console.log(dto);
      return true;
    } catch (e) {
      console.log(e);
      throw new BadRequestException();
    }
  }
}
