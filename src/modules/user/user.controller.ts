import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
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
import { Roles } from '../auth/has-roles.decorator';
import { JWTAuthGuard } from '../auth/jwt-guard';
import { RolesGuard } from '../auth/roles.guard';
import { changePasswordDto } from './dto/changePassword.dto';
import { ResponseUserDto } from './dto/response_user.dto';
import { UpdateAllUserDataDto } from './dto/update.all_user_data';
import { User } from './model/user.model';
import { UserService } from './user.service';

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
  // @UseGuards(JWTAuthGuard)
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
    summary: 'Изменение пароля пользователя - только авторизованным',
  })
  @ApiUnprocessableEntityResponse({ description: 'Bad Request' })
  @ApiForbiddenResponse({ description: 'Unauthorized Request' })
  @ApiResponse({ status: 201, type: changePasswordDto })
  @UseGuards(JWTAuthGuard)
  @Post('changePassword')
  changePassword(
    @Body() dto: changePasswordDto,
    @Req() req: Request,
  ): Promise<Boolean> {
    const userId = req['user'].id;
    return this.userService.changePassword(dto, userId);
  }

  @ApiOperation({
    summary: 'Выдача прав администратора - только супер администраторам',
  })
  @ApiResponse({
    status: 200,
    type: User,
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
  })
  @ApiForbiddenResponse({ description: 'Unauthorized Request' })
  // @UseGuards(JWTAuthGuard)
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
      if (!roles[0]) {
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
}
