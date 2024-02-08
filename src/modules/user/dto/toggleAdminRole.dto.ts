import {ApiProperty} from "@nestjs/swagger";

export class ToggleAdminRoleDto{
    @ApiProperty()
    adminId: number
}