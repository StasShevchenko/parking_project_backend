import { UserInPeriod } from './user.interface';

export interface Period {
  start_time: string;
  end_time: string;
  nextUsers: UserInPeriod[];
}
