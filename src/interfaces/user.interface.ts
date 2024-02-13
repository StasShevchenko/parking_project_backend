import {User} from "../modules/user/model/user.model";

export interface UserInPeriod {
  id: number;
  firstName: string;
  secondName: string;
  email: string;
  active: boolean,
  avatar: string
  swap?: number
  fromNextPeriod?: boolean
}

export function mapToUserInPeriod(user: User, swap: number, fromNextPeriod?: boolean): UserInPeriod{
  return {
    id: user.id,
    firstName: user.firstName,
    secondName: user.secondName,
    email: user.email,
    active: user.active,
    avatar: user.avatar,
    swap: swap,
    fromNextPeriod: fromNextPeriod
  }
}