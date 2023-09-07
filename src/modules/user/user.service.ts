import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import * as bcrypt from 'bcrypt';
import * as uuid from 'uuid';
import { MailService } from '../mail/mail.service';
import { QueueService } from '../queue/queue.service';
import { CreateUserDto } from './dto';
import { changePasswordDto } from './dto/changePassword.dto';
import { UpdateAllUserDataDto } from './dto/update.all_user_data';
import { User } from './model/user.model';

@Injectable()
export class UserService {
  @InjectModel(User) private readonly userRepository: typeof User;
  constructor(
    private readonly queueService: QueueService,
    private readonly mailService: MailService,
  ) {}

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
      await this.mailService.sendRegistrationsEmail(newUser);
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
      throw new BadRequestException('User Exist');
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
    console.log(id);
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

  async getUsersByRoles(
    roles: string[],
    firstName: string,
    secondName: string,
  ) {
    try {
      if (roles.length < 1) {
        throw new BadRequestException('Массив ролей не задан');
      }
      console.log(roles);
      let users: User[] = [];
      if (roles.includes('user')) {
        const user = await this.userRepository.findAll({
          where: { in_queue: true },
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
        for (const NewUser of user) {
          users.push(NewUser);
        }
        return users;
      }

      if (roles.includes('admin')) {
        const admin = await this.userRepository.findAll({
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
        for (const user of admin) {
          users.push(user);
        }
      }
      if (roles.includes('super_admin')) {
        const super_admin = await this.userRepository.findAll({
          where: { is_superuser: true },
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
        for (const user of super_admin) {
          users.push(user);
        }
      }
      if (users.length < 1) {
        throw new BadRequestException();
      }
      if (firstName) {
        users = await this.getUsersByName(firstName, secondName, users);
      }
      return users;
    } catch (e) {
      console.log(e);
      throw new BadRequestException('ошибка', { cause: e });
    }
  }

  getUsersByName(firstName: string, secondName: string, users) {
    firstName = firstName.toLowerCase();
    if (secondName) {
      secondName = secondName.toLowerCase();
    }

    return users
      .filter((user) =>
        user.nextUsers.some(
          (user) =>
            user.firstName.toLowerCase().includes(firstName) ||
            user.secondName.toLowerCase().includes(secondName) ||
            user.secondName.toLowerCase().includes(firstName),
        ),
      )
      .map((users) => {
        return {
          ...users,
          nextUsers: users.nextUsers.filter(
            (user) =>
              user.firstName.toLowerCase().includes(firstName) ||
              user.secondName.toLowerCase().includes(secondName) ||
              user.secondName.toLowerCase().includes(firstName),
          ),
        };
      });
  }
}
