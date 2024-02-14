import {BelongsTo, Column, ForeignKey, Model, Table} from 'sequelize-typescript';
import {User} from "../../user/model/user.model";

@Table({timestamps: false})
export class Queue extends Model {

    @ForeignKey(() => User)
    @Column
    userId: number;

    @Column
    number: number;

    @Column
    swap?: number;

    @BelongsTo(() => User)
    user?: User
}
