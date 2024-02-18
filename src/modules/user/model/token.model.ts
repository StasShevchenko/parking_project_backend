import {Column, ForeignKey, Model, Table} from "sequelize-typescript";
import {User} from "./user.model";
import {InferAttributes, InferCreationAttributes} from "sequelize";

@Table({timestamps: false})
export class Token extends Model<InferAttributes<Token>, InferCreationAttributes<Token>> {
    @Column
    token: string

    @Column
    @ForeignKey(() => User)
    userId: number
}