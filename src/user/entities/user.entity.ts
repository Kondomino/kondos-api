import { Table, Column, Model, DataType } from 'sequelize-typescript';

@Table
export class User extends Model<User> {

    @Column({
        type: DataType.STRING,
        allowNull: false,
    })
    firstName: string;

    @Column({
        type: DataType.STRING,
        allowNull: true,
    })
    lastName: string;

    @Column({
        type: DataType.STRING,
        allowNull: true,
    })
    picture: string;

    @Column({
        type: DataType.STRING,
        allowNull: true,
    })
    password: string;

    @Column({
        type: DataType.STRING,
        unique: true,
        allowNull: false,
    })
    email: string;

    @Column({
        type: DataType.ENUM,
        values: ['male', 'female'],
        allowNull: true,
    })
    gender: string;

    @Column({
        type: DataType.INTEGER,
        allowNull: true,
    })
    age: number;

    @Column({
        defaultValue: true
    })
    active: boolean;

    @Column({
        type: DataType.STRING,
        allowNull: true,
    })
    whatsapp_id: string;

    @Column({
        type: DataType.STRING,
        allowNull: true,
    })
    phone_number: string;

    @Column({
        type: DataType.BOOLEAN,
        defaultValue: false,
    })
    is_deleted: boolean;

    @Column({
        type: DataType.DATE,
        allowNull: true,
    })
    deleted_at: Date;
}