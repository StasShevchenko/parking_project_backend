import { Column, Default, Model, Table } from 'sequelize-typescript';

@Table
export class Swap extends Model {
  @Default(false)
  @Column
  is_active: boolean;

  @Column
  result?: boolean;

  @Column
  sent: Date;

  @Column
  from: Date;

  @Column
  to: Date;

  @Column
  sender: number;

  @Column
  sender_fullName: string;
  @Column
  sender_email: string;

  @Column
  receiver: number;

  @Column
  receiver_fullName: string;

  @Column
  receiver_email: string;
}
