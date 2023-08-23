import { Column, Model, Table } from 'sequelize-typescript';

@Table
export class InputData extends Model {
  @Column
  seats: number;

  @Column
  period: number;

  @Column
  numberOfOutputPeriods: number;
}
