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
    swapInfo: SwapInfo

    @ApiProperty()
    sender: SwapUserInfo

    @ApiProperty()
    receiver: SwapUserInfo
}

class SwapInfo{
    @ApiProperty()
    from: Date

    @ApiProperty()
    to: Date
}
class SwapUserInfo{

    @ApiProperty()
    id: number

    @ApiProperty()
    fullName: string

    @ApiProperty()
    email: string
}