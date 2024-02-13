import {ApiProperty} from "@nestjs/swagger";

export class SwapResponseDto{
    @ApiProperty()
    id: number

    @ApiProperty()
    isActive: boolean

    @ApiProperty()
    result: boolean

    @ApiProperty()
    sent: Date

    @ApiProperty()
    sender: SwapUserInfo

    @ApiProperty()
    receiver: SwapUserInfo
}

class SwapUserInfo{

    @ApiProperty()
    id: number

    @ApiProperty()
    fullName: string

    @ApiProperty()
    email: string
}