import { Column, Default, Model, Table } from 'sequelize-typescript';
import {InferAttributes, InferCreationAttributes} from "sequelize";

@Table({timestamps: false})
export class Swap extends Model<InferAttributes<Swap>, InferCreationAttributes<Swap>> {
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
