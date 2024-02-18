import {BadRequestException, Injectable} from '@nestjs/common';
import {InjectModel} from '@nestjs/sequelize';
import * as bcrypt from 'bcrypt';
import {Op} from 'sequelize';
import * as uuid from 'uuid';
import {AvatarService} from '../avatar/avatar.service';
import {MailService} from '../mail/mail.service';
import {QueueService} from '../queue/queue.service';
import {CreateUserDto} from './dto/createUser.dto';
import {ChangeAvatarDto} from './dto/changeAvatar.dto';
import {ChangePasswordDto, ForgotChangePasswordDto,} from './dto/changePassword.dto';
import {ForgotPasswordDto} from './dto/forgotPassword.dto';
import {UpdateAllUserDataDto} from './dto/update.all_user_data';
import {User} from './model/user.model';
import {Queue} from "../queue/model/queue.model";
import {Swap} from "../swap/model/swap.model";
import {KeyService} from "./key.service";
import {Token} from "./model/token.model";

@Injectable()
export class UserService {
    constructor(
        @InjectModel(User) private readonly userRepository: typeof User,
        private readonly queueService: QueueService,
        private readonly mailService: MailService,
        private readonly keyService: KeyService,
        private readonly avatarService: AvatarService,
    ) {
    }

    async findUserByEmail(email: string) {
        return await this.userRepository.findOne({
            where: {email},
            include: [
                {model: Token}
            ]
        });
    }

    async findUserById(id: number) {
        return await this.userRepository.findByPk(id, {
            include: [{model: Token}]
        });
    }

    uniqueKey() {
        return uuid.v4().substring(0, 8);
    }

    async hashPassword(password: string) {
        return bcrypt.hash(password, 10);
    }

    async createUser(dto: CreateUserDto): Promise<CreateUserDto> {
        const validate = await this.findUserByEmail(dto.email);
        if (validate) {
            throw new BadRequestException('User with this email exist');
        }
        const avatar = this.avatarService.getAvatarToRegistrationUser();
        const key = this.uniqueKey().substring(0, 8);
        const password = await this.hashPassword(key);
        const newUser = await this.userRepository.create({
            firstName: dto.firstName,
            secondName: dto.secondName,
            email: dto.email,
            isAdmin: dto.isAdmin,
            password: password,
            avatar: avatar,
        });
        if (dto.queueUser) {
            const user = await this.findUserByEmail(dto.email);
            await this.queueService.addUserToQueue({
                    userId: user.id
                }
            );
        }
        await this.mailService.sendRegistrationsEmail(newUser, key);
        return dto;
    }

    async getUserById(id: number) {
        const user = await this.userRepository.findOne({
            where: {id},
            attributes: {exclude: ['password', 'refreshToken']},
            include: [
                {
                    model: Queue,
                    include: [{
                        model: Swap
                    }]
                }
            ]
        });
        if (user == null) {
            throw new BadRequestException()
        } else {
            user.startActiveTime = this.queueService.getUserStartDate(user)
            user.endActiveTime = this.queueService.getUserEndDate(user)
            return user
        }
    }

    async updateUser(
        id: number,
        dto: UpdateAllUserDataDto,
    ): Promise<UpdateAllUserDataDto> {
        await this.userRepository.update(dto, {where: {id}});
        return dto;
    }

    async deleteUserById(id: number): Promise<number> {
        const user = await this.userRepository.findOne({where: {id}});
        if (user.isAdmin) {
            throw new BadRequestException('Пользователь является администратором');
        }
        if (user.queueUser) {
            await this.queueService.deleteFromQueue(id);
        }
        const deleteUser = await this.userRepository.destroy({where: {id}});
        return deleteUser;
    }

    async deleteAdminById(id: number): Promise<number> {
        try {
            await this.queueService.deleteFromQueue(id);
            return await this.userRepository.destroy({where: {id}});
        } catch (e) {
            throw new BadRequestException();
        }
    }

    async comparePassword(
        password1: string,
        password2: string,
    ): Promise<boolean> {
        if (password1 === password2) {
            return true
        }
        return bcrypt.compare(password1, password2);
    }

    validatePassword(password: string) {
        const validationPassword = password.trim();
        const containsLetters = /^.*[a-zA-Z]+.*$/;
        const minimum8Chars = /^.{8,}$/;
        const withoutSpaces = /^\S+$/;

        return (
            minimum8Chars.test(validationPassword) &&
            withoutSpaces.test(validationPassword) &&
            containsLetters.test(validationPassword)
        );
    }

    async changePasswordFromProfile(
        dto: ChangePasswordDto,
        email: string,
    ): Promise<boolean> {
        const user = await this.userRepository.findOne({
            where: {email: email},
        });
        console.log(`EMAIL: ${email}`)
        const compareOldPassword = await this.comparePassword(
            dto.oldPassword,
            user.password,
        );
        if (!compareOldPassword) {
            throw new BadRequestException('Wrong password')
        }
        if (dto.newPassword != dto.repeatNewPassword) {
            throw new BadRequestException('Passwords should match');
        }
        if (this.validatePassword(dto.newPassword)) {
            user.password = await this.hashPassword(dto.newPassword);
            user.changedPassword = true;
            await user.save();
            return true;
        } else {
            throw new BadRequestException({message: 'Weak password'});
        }
    }

    async forgotPasswordChange(dto: ForgotChangePasswordDto): Promise<boolean> {
        const key = this.keyService.reviewKey(dto.key)
        const user = await this.userRepository.findOne({
            where: {email: key.email},
        });
        if (!user) {
            throw new BadRequestException({message: 'User not found'});
        }
        if (dto.newPassword == dto.repeatNewPassword) {
            if (this.validatePassword(dto.newPassword)) {
                user.password = await this.hashPassword(dto.newPassword);
                user.changedPassword = true;
                await user.save();
                this.keyService.deleteKey(dto.key);
                return true;
            } else {
                throw new BadRequestException({message: 'Weak password'});
            }
        } else {
            throw new BadRequestException({message: 'Passwords should match'});
        }
    }

    async getUsers(roles: string[], fullName: string) {
        const rolesFilter = [];
        if (roles.includes('user')) {
            rolesFilter.push({queueUser: true});
        }
        if (roles.includes('admin')) {
            rolesFilter.push({isAdmin: true});
        }
        if (roles.includes('super_admin')) {
            rolesFilter.push({isSuperAdmin: true});
        }
        let firstName: string;
        let secondName: string;
        if (fullName.includes(' ')) {
            firstName = fullName.split(' ')[0];
            secondName = fullName.split(' ')[1];
        } else {
            firstName = fullName;
            secondName = '';
        }
        return await this.userRepository.findAll({
            where: {
                [Op.and]: [
                    rolesFilter,
                    {
                        [Op.or]: [
                            {
                                [Op.and]: [
                                    {firstName: {[Op.like]: `%${firstName}%`}},
                                    {secondName: {[Op.like]: `%${secondName}%`}},
                                ],
                            },
                            {
                                [Op.and]: [
                                    {firstName: {[Op.like]: `%${secondName}%`}},
                                    {secondName: {[Op.like]: `%${firstName}%`}},
                                ],
                            },
                            {
                                [Op.or]: [
                                    {secondName: {[Op.like]: `%${firstName + secondName}%`}},
                                    {firstName: {[Op.like]: `%${firstName + secondName}%`}},
                                ],
                            },
                        ],
                    },
                ],
            },
            attributes: {exclude: ['password', 'refreshToken']},
        });
    }

    async addAdminRole(id: number): Promise<User> {
        try {
            const user = await this.userRepository.findByPk(id);
            user.isAdmin = true;
            await user.save();
            return user;
        } catch (e) {
            throw new BadRequestException({status: 401});
        }
    }

    async deleteAdminRole(id: number): Promise<User> {
        try {
            const user = await this.userRepository.findByPk(id);
            user.isAdmin = false;
            await user.save();
            return user;
        } catch (e) {
            throw new BadRequestException({status: 401});
        }
    }

    async forgotPasswordMailKey(dto: ForgotPasswordDto): Promise<boolean> {
        const user = await this.findUserByEmail(dto.email);
        if (user) {
            await this.keyService.generateMailKey(user);
            return true;
        } else throw new BadRequestException({status: 401});
    }

    async changeAvatar(dto: ChangeAvatarDto, userId: number): Promise<boolean> {
        try {
            const user: User = await this.userRepository.findByPk(userId);
            user.avatar = dto.avatarName;
            await user.save();
            return true;
        } catch (e) {
            console.log(e);
            throw new BadRequestException();
        }
    }
}
