import { Model } from 'sequelize-typescript';
export declare class User extends Model<User> {
    name: string;
    email: string;
    gender: string;
    age: number;
    active: boolean;
}
