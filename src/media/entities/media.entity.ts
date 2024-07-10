import { Table, Column, Model, DataType, ForeignKey, BelongsTo } from "sequelize-typescript";
import { Kondo } from "../../kondo/entities/kondo.entity";
import { Unit } from "../../unit/entities/unit.entity";

const MediaTypes = Object.freeze({
    Video: 'video',
    Image: 'image',
  });

module.exports.MediaTypes = MediaTypes;

@Table
export class Media extends Model<Media> {
      
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