import {ApiProperty} from "@nestjs/swagger";

export class ToggleAdminRoleDto{
    @ApiProperty()
    userId: number
}