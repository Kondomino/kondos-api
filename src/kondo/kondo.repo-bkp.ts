import { Repo } from "src/core/infra/repo";
import { Kondo } from "./entities/Kondo.entity";

export interface IKondoRepo extends Repo<Kondo> {
    //findByKondoId (KondoId: string): Promise<Kondo>;
  }
  
  export class KondoRepo implements IKondoRepo {
    private models: any;
  
    constructor (models: any) {
      this.models = models;
    }

    
    /*
  public async findByKondoId (kondoId: string): Promise<Kondo> {
    return 
  }
  */
}
  