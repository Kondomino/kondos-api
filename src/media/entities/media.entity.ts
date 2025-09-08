import { Table, Column, Model, DataType, ForeignKey, BelongsTo } from "sequelize-typescript";
import { Kondo } from "../../kondo/entities/kondo.entity";
import { Unit } from "../../unit/entities/unit.entity";

const MediaTypes = Object.freeze({
    Video: 'video',
    Image: 'image',
  });

const MediaStatus = Object.freeze({
    Final: 'final',
    Draft: 'draft',
  });

module.exports.MediaTypes = MediaTypes;
module.exports.MediaStatus = MediaStatus;

@Table
export class Media extends Model {
      
    @Column({
        type: DataType.STRING,
        allowNull: false,
    })
    filename: string;
 
    @Column({
        values: Object.values(MediaTypes),
        defaultValue: 'image',
    })
    type: string;

    @Column({
        type: DataType.ENUM('final', 'draft'),
        defaultValue: 'draft',
    })
    status: 'final' | 'draft';

    @Column({
        type: DataType.STRING,
        allowNull: true,
    })
    storage_url: string;
    
    @ForeignKey(() => Kondo)
    @Column
    kondoId: number;

    @BelongsTo(() => Kondo)
    kondo: Kondo;

    @ForeignKey(() => Unit)
    @Column
    unitId: number;

    @BelongsTo(() => Unit)
    unit: Unit;
}

//Media.belongsTo(Kondo);