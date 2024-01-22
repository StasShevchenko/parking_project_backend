import { Injectable } from '@nestjs/common';
import * as fs from 'fs-extra';

@Injectable()
export class AvatarService {
  getAll(directoryPath: string) {
    return fs.readdirSync(directoryPath);
  }

  getAvatarToRegistrationUser(): string {
    const rand = Math.floor(Math.random() * (25 - 21 + 1)) + 21;
    return 'ava' + rand + '.png';
  }
}
