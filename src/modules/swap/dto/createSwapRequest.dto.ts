import {ApiProperty} from "@nestjs/swagger";

export class CreateSwapRequestDto{
    @ApiProperty()
    senderId: number

    @ApiProperty()
    receiverId: number
}