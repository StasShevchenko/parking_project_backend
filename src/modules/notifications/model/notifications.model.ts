import {
  BelongsTo,
  Column,
  Default,
  ForeignKey,
  Model,
  Table,
} from 'sequelize-typescript';
import { User } from 'src/modules/user/model/user.model';

@Table
export class Notification extends Model {
  @Column
  text: string;

  @Default(false)
  @Column
  read: boolean;

  @BelongsTo(() => User)
  user: User;

  @ForeignKey(() => User)
  @Column
  userId: number;
}
