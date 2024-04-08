import { Table, Column, Model, DataType } from 'sequelize-typescript';

@Table
export class Kondo extends Model<Kondo> {
    @Column({
        type: DataType.STRING,
        allowNull: false,
    })
    name: string;
}