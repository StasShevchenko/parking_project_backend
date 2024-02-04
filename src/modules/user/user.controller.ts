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
import { Roles } from '../auth/hasRoles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { MailKey } from '../mail_key/model/mail_key.model';
import { ChangeAvatarDto } from './dto/changeAvatar.dto';
import {
  PasswordForgotChangeDto,
  changePasswordFromProfileDto,
} from './dto/changePassword.dto';
import { ForgotPasswordDto } from './dto/forgot_password.dto';
import { MailKeyReviewDto } from './dto/mail_key_review.dto';
import { ResponseUserDto } from './dto/response_user.dto';
import { UpdateAllUserDataDto } from './dto/update.all_user_data';
import { User } from './model/user.model';
import { UserService } from './user.service';
import {JwtAuthGuard} from "../auth/jwtAuth.guard";

@ApiTags('Users')
@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Получение конкретного пользователя - только авторизованным',
  })
  @ApiResponse({
    status: 200,
    type: ResponseUserDto,
  })
  @ApiForbiddenResponse({ description: 'Unauthorized Request' })
  @UseGuards(JwtAuthGuard)
  @Get(':id')
  getUser(@Param('id') id: number) {
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
  @UseGuards(JwtAuthGuard)
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
  @UseGuards(JwtAuthGuard)
  @Post('changePassword')
  changePassword(
    @Body() dto: changePasswordFromProfileDto,
    @Request() req,
  ): Promise<boolean> {
    return this.userService.changePasswordFromProfile(dto, req.user.email);
  }

  @ApiOperation({
    summary: 'Изменение пароля пользователя, если забыл - всем',
  })
  @ApiUnprocessableEntityResponse({ description: 'Bad Request' })
  @ApiResponse({ status: 201, type: PasswordForgotChangeDto })
  @Post('forgotPasswordChange')
  ForgotPasswordChange(@Body() dto: PasswordForgotChangeDto): Promise<boolean> {
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
    return this.userService.addAdminRole(id);
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
  @Get('')
  getUsers(
      @Query('roles') roles: string,
      @Query('fullName') fullName: string = ''
  ) {
    let rolesFilter = [];
    if (roles) {
      const rolesString = roles.slice(1, -1);
      rolesFilter = rolesString.split(',').map((role) => role.trim());
    }
    return this.userService.getUsers(rolesFilter, fullName);
  }

  @ApiOperation({
    summary: 'Запрос на изменение пароля - всем',
  })
  @ApiUnprocessableEntityResponse({ description: 'Bad Request' })
  @ApiResponse({ status: 201, type: Boolean })
  @Post('forgotPassword')
  forgotPasswordMailKey(@Body() dto: ForgotPasswordDto): Promise<boolean> {
    return this.userService.forgotPasswordMailKey(dto);
  }

  @ApiOperation({
    summary: 'Проверка кода для сброса пароля - всем',
  })
  @ApiUnprocessableEntityResponse({ description: 'Bad Request' })
  @ApiResponse({ status: 201, type: MailKey })
  @Post('reviewKey')
  MailKeyReview(@Body() dto: MailKeyReviewDto): Promise<string> {
    return this.userService.KeyReview(dto);
  }

  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Изменение аватарки пользователя - только авторизованным',
  })
  @ApiUnprocessableEntityResponse({ description: 'Bad Request' })
  @ApiResponse({ status: 201, type: ChangeAvatarDto })
  @UseGuards(JwtAuthGuard)
  @Post('changeAvatar')
  changeAvatar(@Body() dto: ChangeAvatarDto, @Request() req): Promise<boolean> {
    return this.userService.changeAvatar(dto, req.user.id);
  }
}
