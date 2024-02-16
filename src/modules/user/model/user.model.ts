import {Column, Default, HasMany, HasOne, Model, Table} from 'sequelize-typescript';
import {Notification} from '../../notifications/model/notifications.model';
import {Queue} from "../../queue/model/queue.model";

@Table({timestamps: false})
export class User extends Model {
    @Column
    firstName: string;

    @Column
    secondName: string;

    @Column
    email: string;

    @Column
    password: string;

    @Default(false)
    @Column
    isAdmin: boolean;

    @Default(false)
    @Column
    active: boolean;

    @Default(false)
    @Column
    isSuperAdmin: boolean;

    @Default(false)
    @Column
    queueUser: boolean;

    @Column
    startActiveTime: Date;

    @Column
    endActiveTime: Date;

    @Column
    lastActivePeriod: Date;

    @Default(null)
    @Column
    avatar: string;

    @Default(false)
    @Column
    changedPassword: boolean;

    @Column
    refreshToken?: string;

    @HasMany(() => Notification)
    notifications: Notification[];

    @HasOne(() => Queue)
    queue: Queue
}
