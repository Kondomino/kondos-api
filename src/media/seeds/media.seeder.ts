import { Seeder, OnSeederInit } from "nestjs-sequelize-seeder";
import { mediaSeeds } from "./media.seeds";

export const __mediaSeeder = [];

  @Seeder({
    model: 'Media',
    unique: [],
 })
 export class SeedMedia implements OnSeederInit {

   //data: [];

   run() {
    console.log('running seeds');

      return mediaSeeds;
    }

 }