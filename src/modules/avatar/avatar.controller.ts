import { Controller, Get } from '@nestjs/common';
import { AvatarService } from './avatar.service';

@Controller('avatar')
export class AvatarController {
    constructor(private readonly avatarService: AvatarService) {}

    @Get('')
    getAllAvatars() {
        // const directoryPath = 'D:/parking_project/src/static';
        const directoryPath =  '/home/develop/src/static'
        return this.avatarService.getAll(directoryPath);
    }
}
