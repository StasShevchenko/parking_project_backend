import { ApiProperty } from '@nestjs/swagger'
import { IsNumber, IsString } from 'class-validator'

export class LoginUserDTO {
	@ApiProperty()
	@IsString()
	email: string

	@ApiProperty()
	@IsString()
	password: string
}

export class AuthUserResponseDTO {
	@ApiProperty()
	@IsString()
	jwtAccess: string

	@ApiProperty()
	@IsString()
	jwtRefresh: string
}

export default {
	LoginUserDTO,
	AuthUserResponseDTO,
}
