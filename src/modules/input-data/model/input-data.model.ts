import { Column, Model, Table } from 'sequelize-typescript';

@Table({timestamps: false})
export class InputData extends Model {
  @Column
  seats: number;

  @Column
  period: number;

  @Column
  numberOfOutputPeriods: number;
}
