import { Column, Model, Table } from 'sequelize-typescript';

@Table
export class QueueAhead extends Model {
  @Column
  userId: number;

  @Column
  number: number;

  @Column
  start_period_time: Date;

  @Column
  end_period_time: Date;

  @Column
  gave: boolean;

  @Column
  gave_userId: number;

  @Column
  start_gave_time: Date;

  @Column
  end_gave_time: Date;
}
