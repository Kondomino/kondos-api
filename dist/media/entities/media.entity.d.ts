import { Model } from "sequelize-typescript";
export declare class Media extends Model<Media> {
    filename: string;
    type: string;
    kondoId: number;
}
