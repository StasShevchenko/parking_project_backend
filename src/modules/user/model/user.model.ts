import { Column, Default, Model, Table } from 'sequelize-typescript';

@Table
export class User extends Model {
  @Column
  firstName?: string;

  @Column
  secondName?: string;

  @Column
  email: string;

  @Column
  password: string;

  @Default(false)
  @Column
  is_staff: boolean;

  @Default(false)
  @Column
  active: boolean;

  @Default(false)
  @Column
  is_superuser: boolean;

  @Default(false)
  @Column
  in_queue: boolean;
  @Column
  start_active_time: Date;

  @Column
  end_active_time: Date;

  @Column
  last_active_period: Date;
}
