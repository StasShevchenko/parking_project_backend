import {User} from "../modules/user/model/user.model";
import {Swap} from "../modules/swap/model/swap.model";

export interface UserInPeriod {
  id: number;
  firstName: string;
  secondName: string;
  email: string;
  active: boolean,
  avatar: string
  swap?: number
  swapInfo?: Swap
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
    swapInfo: user.queue.swap,
    fromNextPeriod: fromNextPeriod
  }
}