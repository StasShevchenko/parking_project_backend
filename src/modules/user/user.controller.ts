import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiResponse, ApiTags } from '@nestjs/swagger';
import { Roles } from '../auth/has-roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { CreateUserDto } from './dto';
import { UpdateAllUserDataDto } from './dto/update.all_user_data';
import { User } from './model/user.model';
import { UserService } from './user.service';

@ApiTags('Users')
@Controller('user')
// @UseGuards(AuthGuard('jwt'), RolesGuard)
export class UserController {
  constructor(private readonly userService: UserService) {}

  @ApiResponse({ status: 201, type: CreateUserDto })
  @Post('')
  // @UseGuards(RolesGuard)
  // @Roles('is_staff')
  createUser(@Body() dto: CreateUserDto): Promise<CreateUserDto> {
    return this.userService.createUser(dto);
  }

  @ApiResponse({ status: 200, type: CreateUserDto })
  @Get('')
  getAllUsers(): Promise<User[]> {
    return this.userService.getAllUsers();
  }

  @ApiResponse({ status: 200, type: CreateUserDto })
  @Get(':id')
  getUser(@Param('id') id): Promise<User> {
    return this.userService.getUserById(id);
  }

  @ApiResponse({ status: 200, type: CreateUserDto })
  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles('is_staff')
  deleteUser(@Param('id') id): Promise<number> {
    return this.userService.deleteUserById(id);
  }

  @ApiResponse({ status: 201, type: UpdateAllUserDataDto })
  @Patch('update/:id')
  updateUser(
    @Param('id') id,
    dto: UpdateAllUserDataDto,
  ): Promise<UpdateAllUserDataDto> {
    return this.userService.updateUser(id, dto);
  }
}
