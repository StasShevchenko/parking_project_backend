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

  // @ApiBearerAuth()
  // @ApiOperation({ summary: 'Получение всех пользователей - только админам' })
  // @ApiResponse({
  //   status: 200,
  //   type: ResponseUserDto,
  // })
  // @ApiForbiddenResponse({ description: 'Unauthorized Request' })
  // @Get('')
  // // @UseGuards(RolesGuard)
  // // @Roles('is_staff')
  // getAllUsers(): Promise<User[]> {
  //   return this.userService.getAllUsers();
  // }

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
  getUsersByRoles(
    @Query('roles') roles: string,
    @Query('fullName') fullName: string,
  ) {
    if (!roles && !fullName) {
      return this.userService.getAllUsers();
    }
    const rolesString = roles.slice(1, -1);
    const rolesArray = rolesString.split(',').map((role) => role.trim());
    if (fullName) {
      const [firstName, secondName] = fullName.split(' ');
      console.log(firstName);
      console.log(`fullName = ${firstName} ${secondName}`);
      return this.userService.getUsersByRoles(
        rolesArray,
        firstName,
        secondName,
      );
    }
    return this.userService.getUsersByRoles(rolesArray, null, null);
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
}
