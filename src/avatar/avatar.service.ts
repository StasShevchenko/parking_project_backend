import { Injectable } from '@nestjs/common';
import * as fs from 'fs-extra';

@Injectable()
export class AvatarService {

    getAll(directoryPath: String) {
        return fs.readdirSync(directoryPath);
    }
}

