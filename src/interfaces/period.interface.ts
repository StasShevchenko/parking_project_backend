import { UserInPeriod } from './user.interface';

export interface Period {
  startTime: string;
  endTime: string;
  nextUsers: UserInPeriod[];
}
