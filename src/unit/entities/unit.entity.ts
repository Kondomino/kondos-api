import { BelongsTo, Column, ForeignKey, Model, Table } from "sequelize-typescript";
import { Kondo } from "../../kondo/entities/kondo.entity";
import { User } from "../../user/entities/user.entity";

export const UnitStatus = Object.freeze({
    DRAFT: 'draft',
    TEXT_READY: 'text_ready',
    MEDIA_GATHERING: 'media_gathering',
    PUBLISHED: 'published',
  });


@Table
export class Unit extends Model {

    @Column({
        allowNull: false,
    })
    title: string;

    @ForeignKey(() => Kondo)
    @Column
    kondoId: number;
    
    @BelongsTo(() => Kondo)
    kondo: Kondo;
    
    @ForeignKey(() => User)
    @Column
    userId: number;
    
    @BelongsTo(() => User)
    user: User;
    
    @Column({
        defaultValue: true
    })
    active: boolean;

    @Column({
        values: Object.values(UnitStatus),
        defaultValue: UnitStatus.DRAFT
    })
    status: string;

    @Column({
        defaultValue: 0
    })
    bedroms: number;

    @Column({
        defaultValue: 0
    })
    baths: number;

    @Column({
        defaultValue: 0
    })
    suites: number;

    @Column({
        defaultValue: 0
    })
    parking_spaces: number;

    @Column({
        defaultValue: false
    })
    is_roof: boolean; // Cobertura?

    @Column({
        allowNull: true,
    })
    value: string;

    @Column({
        defaultValue: false
    })
    furnished: boolean;

    @Column({
        defaultValue: false
    })
    closet: boolean;
}
