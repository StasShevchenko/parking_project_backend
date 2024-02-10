import { Controller, Get } from '@nestjs/common';
import { AvatarService } from './avatar.service';
import {join} from "path";

@Controller('avatar')
export class AvatarController {
  constructor(private readonly avatarService: AvatarService) {}

  @Get('')
  getAllAvatars() {
    const directoryPath = join(__dirname, '..', '../../src/static/');
    return this.avatarService.getAll(directoryPath);
  }
}
