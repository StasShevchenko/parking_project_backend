import {Injectable} from '@nestjs/common';
import * as fs from 'fs-extra';

@Injectable()
export class AvatarService {

    getAll(directoryPath: String) {
        return fs.readdirSync(directoryPath);
    }

    getAvatarToRegistrationUser(): String{
        const rand = Math.floor(Math.random() * (25 - 21 + 1)) + 21;
        return 'ava' + rand + '.png'
    }
}

