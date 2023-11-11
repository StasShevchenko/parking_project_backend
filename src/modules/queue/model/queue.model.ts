import { Column, Model, Table } from 'sequelize-typescript';

@Table
export class Queue extends Model {
  @Column
  userId: number;

  @Column
  number: number;

  @Column
  start_period_time: Date;

  @Column
  end_period_time: Date;

  @Column
  swap: number;
}
