import { Kondo } from "../entities/Kondo.entity";

/**
 * @param Kondo
 * @param created? (Has the entity been created? When false, means that entity was found in db)
 */
export type findOrCreateType = [Kondo | null, Boolean];