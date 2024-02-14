import { Column, Model, Table } from 'sequelize-typescript';

@Table({timestamps: false})
export class Queue extends Model {
  @Column
  userId: number;

  @Column
  number: number;

  @Column
  swap?: number;
}
