import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiForbiddenResponse,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
  ApiUnprocessableEntityResponse,
} from '@nestjs/swagger';
import { combinedLogger } from 'src/utils/logger.config';
import { Roles } from '../auth/has-roles.decorator';
import { JWTAuthGuard } from '../auth/jwt-guard';
import { RolesGuard } from '../auth/roles.guard';
import { MailKey } from '../mail_key/model/mail_key.model';
import { PasswordForgotChangeDto, changePasswordFromProfileDto } from './dto/changePassword.dto';
import { ForgotPasswordDto } from './dto/forgot_password.dto';
import { MailKeyReviewDto } from './dto/mail_key_review.dto';
import { ResponseUserDto } from './dto/response_user.dto';
import { UpdateAllUserDataDto } from './dto/update.all_user_data';
import { User } from './model/user.model';
import { UserService } from './user.service';
import { join } from 'path';

@ApiTags('Users')
@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @ApiBearerAuth()
  @ApiOperation({ summary: 'Получение всех админов - только авторизованным' })
  @ApiResponse({
    status: 200,
    type: ResponseUserDto,
  })
  @ApiForbiddenResponse({ description: 'Unauthorized Request' })
  @Get('adminList')
  adminList(): Promise<User[]> {
    combinedLogger.info({ Message: 'Admin List' });
    return this.userService.getAdminsList();
  }

  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Получение конкретного пользователя - только авторизованным',
  })
  @ApiResponse({
    status: 200,
    type: ResponseUserDto,
  })
  @ApiForbiddenResponse({ description: 'Unauthorized Request' })
  @UseGuards(JWTAuthGuard)
  @Get(':id')
  getUser(@Param('id') id: number): Promise<User> {
    return this.userService.getUserById(id);
  }

  @ApiBearerAuth()
  @ApiOperation({ summary: 'Удаление пользователя - только админам' })
  @ApiResponse({
    status: 200,
    description: 'Response: 1',
  })
  @ApiForbiddenResponse({ description: 'Unauthorized Request' })
  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles('is_staff')
  deleteUser(@Param('id') id: number): Promise<number> {
    return this.userService.deleteUserById(id);
  }

  @ApiBearerAuth()
  @ApiOperation({ summary: 'Удаление администратора - только супер админам' })
  @ApiResponse({
    status: 200,
    description: 'Response: 1',
  })
  @ApiForbiddenResponse({ description: 'Unauthorized Request' })
  @Delete('admin/:id')
  @UseGuards(RolesGuard)
  @Roles('is_superuser')
  deleteAdmin(@Param('id') id: number): Promise<number> {
    return this.userService.deleteAdminById(id);
  }

  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Обновление данных пользователя - только авторизованным',
  })
  @ApiResponse({
    status: 201,
    type: UpdateAllUserDataDto,
  })
  @ApiUnprocessableEntityResponse({ description: 'Bad Request' })
  @ApiForbiddenResponse({ description: 'Unauthorized Request' })
  @UseGuards(JWTAuthGuard)
  @Patch('update/:id')
  updateUser(
    @Param('id') id: number,
    dto: UpdateAllUserDataDto,
  ): Promise<UpdateAllUserDataDto> {
    return this.userService.updateUser(id, dto);
  }

  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Изменение пароля пользователя из профиля- только авторизованным',
  })
  @ApiUnprocessableEntityResponse({ description: 'Bad Request' })
  @ApiResponse({ status: 201, type: changePasswordFromProfileDto })
  @UseGuards(JWTAuthGuard)
  @Post('changePassword')
  changePassword(@Body() dto: changePasswordFromProfileDto, @Request() req): Promise<Boolean> {
    return this.userService.changePasswordFromProfile(dto, req.user.email);
  }


  @ApiOperation({
    summary: 'Изменение пароля пользователя, если забыл - всем',
  })
  @ApiUnprocessableEntityResponse({ description: 'Bad Request' })
  @ApiResponse({ status: 201, type: PasswordForgotChangeDto })
  @Post('forgotPasswordChange')
  ForgotPasswordChange(@Body() dto: PasswordForgotChangeDto): Promise<Boolean> {
    return this.userService.ForgotPasswordChange(dto);
  }

  @ApiOperation({
    summary: 'Выдача прав администратора - только супер администраторам',
  })
  @ApiResponse({
    status: 200,
    type: ResponseUserDto,
  })
  @ApiForbiddenResponse({ description: 'Unauthorized Request' })
  @UseGuards(RolesGuard)
  @Roles('is_superuser')
  @Get('getAdminRole/:id')
  getAdminRole(@Param('id') id: number): Promise<User> {
    return this.userService.getAdminRole(id);
  }

  @ApiOperation({
    summary: 'Удаление прав администратора - только супер администраторам',
  })
  @ApiResponse({
    status: 200,
    type: ResponseUserDto,
  })
  @ApiForbiddenResponse({ description: 'Unauthorized Request' })
  @UseGuards(RolesGuard)
  @Roles('is_superuser')
  @Get('deleteAdminRole/:id')
  deleteAdminRole(@Param('id') id: number): Promise<User> {
    return this.userService.deleteAdminRole(id);
  }

  @ApiOperation({
    summary: 'Получение всех пользователей по роли - только авторизованным',
  })
  @ApiParam({ name: 'roles', type: String })
  @ApiResponse({
    status: 200,
    type: ResponseUserDto,
  })
  @ApiForbiddenResponse({ description: 'Unauthorized Request' })
  @UseGuards(JWTAuthGuard)
  @Get('')
  getUsersByRolesTest(
    @Query('roles') roles: string,
    @Query('fullName') fullName: string,
  ) {
    let rolesFilter = [];
    let firstName;
    let secondName;
    if (roles) {
      const rolesString = roles.slice(1, -1);
      rolesFilter = rolesString.split(',').map((role) => role.trim());
      if (roles.length <=3) {
        console.log(roles[0])
        return [];
      }
    }
    if (fullName) {
      [firstName, secondName] = fullName.split(' ');
    }
    if (!roles && !fullName) {
      // Если нет параметров в запросе
      return this.userService.getAllUsers();
    }

    if (!roles && fullName) {
      return this.userService.getUsersByName(firstName, secondName);
    }
    return this.userService.getUsersByRolesTest(
      rolesFilter,
      firstName,
      secondName,
    );
  }

  @ApiOperation({
    summary: 'Запрос на изменение пароля - всем',
  })
  @ApiUnprocessableEntityResponse({ description: 'Bad Request' })
  @ApiResponse({ status: 201, type: Boolean })
  @Post('forgotPassword')
  forgotPasswordMailKey(@Body() dto: ForgotPasswordDto): Promise<Boolean> {
    return this.userService.forgotPasswordMailKey(dto);
  }

  @ApiOperation({
    summary: 'Проверка кода для сброса пароля - всем',
  })
  @ApiUnprocessableEntityResponse({ description: 'Bad Request' })
  @ApiResponse({ status: 201, type: MailKey })
  @Post('reviewKey')
  MailKeyReview(@Body() dto: MailKeyReviewDto): Promise<String> {
    return this.userService.KeyReview(dto);
  }

  @Get("/test/test")
  test() {
    const a = join(__dirname, '..')
    return a
}


}