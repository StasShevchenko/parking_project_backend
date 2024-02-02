import {ApiProperty} from "@nestjs/swagger";
import {IsString} from "class-validator";

export class LoginUserResponseDto {
    @ApiProperty()
    @IsString()
    jwtAccess: string;

    @ApiProperty()
    @IsString()
    jwtRefresh: string;
}

