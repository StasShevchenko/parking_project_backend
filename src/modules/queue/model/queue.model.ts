import {BelongsTo, Column, ForeignKey, HasOne, Model, Table} from 'sequelize-typescript';
import {User} from "../../user/model/user.model";
import {Swap} from "../../swap/model/swap.model";
import {InferAttributes, InferCreationAttributes} from "sequelize";

@Table({timestamps: false})
export class Queue extends Model<InferAttributes<Queue>, InferCreationAttributes<Queue>> {

    @ForeignKey(() => User)
    @Column
    userId: number;

    @Column
    number: number;

    @Column
    swapNumber: number;

    @ForeignKey(() => Swap)
    @Column
    swapId?: number;

    @BelongsTo(() => Swap)
    swap?: Swap

    @BelongsTo(() => User)
    user?: User
}
