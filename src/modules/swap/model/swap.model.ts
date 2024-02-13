import { Column, Default, Model, Table } from 'sequelize-typescript';

@Table({timestamps: false})
export class Swap extends Model {
  @Default(false)
  @Column
  active: boolean;

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
  senderFullName: string;
  @Column
  senderEmail: string;

  @Column
  receiver: number;

  @Column
  receiverFullName: string;

  @Column
  receiverEmail: string;
}
