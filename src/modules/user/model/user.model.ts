import { Column, Default, HasMany, Model, Table } from 'sequelize-typescript';
import { Notification } from '../../notifications/model/notifications.model';

@Table({timestamps: false})
export class User extends Model {
  @Column
  firstName: string;

  @Column
  secondName: string;

  @Column
  email: string;

  @Column
  password: string;

  @Default(false)
  @Column
  isAdmin: boolean;

  @Default(false)
  @Column
  active: boolean;

  @Default(false)
  @Column
  isSuperAdmin: boolean;

  @Default(false)
  @Column
  queueUser: boolean;

  @Column
  startActiveTime: Date;

  @Column
  endActiveTime: Date;

  @Column
  lastActivePeriod: Date;

  @Default(null)
  @Column
  avatar: string;

  @Default(false)
  @Column
  changedPassword: boolean;

  @Column
  refreshToken?: string;

  @HasMany(() => Notification)
  notifications: Notification[];
}
