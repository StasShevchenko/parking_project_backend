import {BadRequestException, Injectable} from "@nestjs/common";
import {User} from "./model/user.model";
import {MailService} from "../mail/mail.service";

@Injectable()
export class KeyService{
    keysList: {key: number, email: string}[] = []
    constructor(
        private readonly mailService: MailService,
    ) {
    }

    async generateMailKey(user: User) {
        try {
            const key = Math.round(Math.random() * (9999 - 1000) + 1000);
            this.keysList.push({key: key, email: user.email})
            setTimeout(() => this.keysList = this.keysList.filter((keyValue) => keyValue.key !== key), 5 * 1000 * 60)
            await this.mailService.sendChangeKey(key, user);
        } catch (e) {
            console.log(e);
            throw new BadRequestException({ status: 401 });
        }
    }

    reviewKey(key: number): { key: number, email: string } {
        const searchedKey = this.keysList.find((keyValue) => keyValue.key === key)
        if (!searchedKey) {
            throw new BadRequestException()
        }
        return searchedKey;
    }

    deleteKey(key: number) {
        this.keysList = this.keysList.filter((keyValue) => keyValue.key !== key)
    }
}