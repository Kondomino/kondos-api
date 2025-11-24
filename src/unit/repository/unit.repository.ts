import { Injectable, Inject } from "@nestjs/common";
import { UNIT_REPOSITORY_PROVIDER } from "src/core/constants";
import { UpdateUnitDto } from "../dto/update-unit.dto";
import { Unit } from "../entities/unit.entity";

type findOrCreateType = [Unit | null, boolean];

@Injectable()
export class UnitRepository {

    constructor(@Inject(UNIT_REPOSITORY_PROVIDER) private readonly UnitRepositoryProvider: typeof Unit) { 
    }

    async find(): Promise<Unit[]> {
        return await this.UnitRepositoryProvider.findAll<Unit>();
    }

    async findOne(): Promise<Unit> {
        return await this.UnitRepositoryProvider.findOne<Unit>();
    }

    async findAll(): Promise<Unit[]> {
        return await this.UnitRepositoryProvider.findAll<Unit>();
    }

    /**
     * Find or Create
     * 
     * @param findOrCreate 
     *      Will try to find by id or slug.
     *      If nothing is found, will create.
     * @returns 
     */
    async findOrCreate(findOrCreate: { where: { id?: number, slug?: string }, defaults: Partial<Unit>}): Promise<findOrCreateType> {
        return await this.UnitRepositoryProvider.findOrCreate<Unit>(findOrCreate);    
    }

    /**
     * Update 
     * 
     * @param updateUnitDto 
     * @param where {
                        where: {
                        lastName: null,
                        },
                    },
     * @returns 
     */
    async update(updateUnitDto: UpdateUnitDto, where): Promise<object> {
        return await this.UnitRepositoryProvider.update<Unit>(updateUnitDto, { where });
    }

    async destroy(): Promise<number> {
        return await this.UnitRepositoryProvider.destroy<Unit>();
    }

    async create(createUnitDto: Partial<Unit>): Promise<Unit> {
        return await this.UnitRepositoryProvider.create<Unit>(createUnitDto);
    }

}