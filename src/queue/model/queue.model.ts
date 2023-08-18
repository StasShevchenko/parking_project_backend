import { Column, Model, Table } from 'sequelize-typescript';

@Table
export class Queue extends Model {
  @Column
  userId: number;

  @Column
  number: number;
}
