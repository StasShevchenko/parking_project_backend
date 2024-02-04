import { User } from '../../model/user.model';
import { CreateUserDto } from '../../dto/createUser.dto';

export function mapUserToCreateUserDto({
  firstName,
  secondName,
  email,
  isAdmin,
}): CreateUserDto {
  return {
    firstName,
    secondName,
    email,
    isAdmin,
  };
}
