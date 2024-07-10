
import { BelongsTo, Model, Column, ForeignKey, Table } from "sequelize-typescript";
import { Kondo } from "../../kondo/entities/kondo.entity";
import { Unit } from "../../unit/entities/unit.entity";
import { User } from "../../user/entities/user.entity";

@Table
export class Like extends Model<Like> {

    // userid
    @ForeignKey(() => User)
    @Column
    userId: number;
    
    @BelongsTo(() => User)
    user: User;

    // kondoId
    @ForeignKey(() => Kondo)
    @Column
    kondoId: number;
    
    @BelongsTo(() => Kondo)
    kondo: Kondo;

    // unitId
    @ForeignKey(() => Unit)
    @Column
    unitId: number;
    
    @BelongsTo(() => Unit)
    unit: Unit;
}
