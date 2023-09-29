import { Injectable } from '@nestjs/common';
import * as fs from 'fs-extra';
import { User } from '../user/model/user.model';

@Injectable()
export class AvatarService {

    getAll(directoryPath: String) {
        return fs.readdirSync(directoryPath);
    }

    getAvatarToRegistrationUser(): String{
        const rand = Math.random() * (25-21) + 21
        const avatarName = 'ava' + rand
        return avatarName
    }
}

