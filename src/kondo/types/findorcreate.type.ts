import { User } from "../../user/entities/user.entity";
import { Kondo } from "../entities/kondo.entity";

/**
 * @param Kondo
 * @param created? (Has the entity been created? When false, means that entity was found in db)
 */
export type findOrCreateType = [Kondo | User | null, boolean];