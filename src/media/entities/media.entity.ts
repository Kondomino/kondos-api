import { Table, Column, Model, DataType, ForeignKey } from "sequelize-typescript";
import { Kondo } from "../../kondo/entities/Kondo.entity";

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

    // @Column({
    //     type: DataType.STRING,
    //     allowNull: false,
    // })
    // kondoId: IntegerDataType;
    
    @ForeignKey(() => Kondo)
    @Column
    kondoId: number;
}