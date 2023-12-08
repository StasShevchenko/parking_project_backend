import { User } from '../../model/user.model';
import { CreateUserDto } from '../../dto';

export function mapUserToCreateUserDto({
  firstName,
  secondName,
  email,
  is_staff,
}): CreateUserDto {
  return {
    firstName,
    secondName,
    email,
    is_staff,
  };
}
