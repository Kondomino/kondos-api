import { OnSeederInit } from "nestjs-sequelize-seeder";
export declare const __mediaSeeder: any[];
export declare class SeedMedia implements OnSeederInit {
    run(): ({
        filename: string;
        kondoId: number;
        type?: undefined;
    } | {
        filename: string;
        kondoId: number;
        type: string;
    })[];
}
