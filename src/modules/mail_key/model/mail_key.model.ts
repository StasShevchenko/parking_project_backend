import { Column, Model, Table } from 'sequelize-typescript';

@Table
export class MailKey extends Model {
  @Column
  email: string;

  @Column
  key: number;
}
