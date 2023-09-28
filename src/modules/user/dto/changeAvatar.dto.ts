import { ApiProperty } from "@nestjs/swagger";

export class ChangeAvatarDto {

    @ApiProperty()
    avatarName: String
}