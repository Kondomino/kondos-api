import { Injectable, Inject } from "@nestjs/common";
import { Kondo } from "../entities/Kondo.entity";
import { KONDO_REPOSITORY_PROVIDER } from "src/core/constants";
import { CreateKondoDto } from "../dto/create-kondo.dto";
import { UpdateKondoDto } from "../dto/update-Kondo.dto";

type findOrCreateType = [Kondo | null, Boolean];

@Injectable()
export class KondoRepository {

    constructor(@Inject(KONDO_REPOSITORY_PROVIDER) private readonly KondoRepositoryProvider: typeof Kondo) { 
    }

    async find(): Promise<Kondo[]> {
        return await this.KondoRepositoryProvider.findAll<Kondo>();
    }

    async findOne(): Promise<Kondo> {
        return await this.KondoRepositoryProvider.findOne<Kondo>();
    }

    async findAll(): Promise<Kondo[]> {
        return await this.KondoRepositoryProvider.findAll<Kondo>();
    }

    /**
     * Find or Create
     * 
     * @param findOrCreate 
     *      Will try to find by id or slug.
     *      If nothing is found, will create.
     * @returns 
     */
    async findOrCreate(findOrCreate: { where: { id?: Number, slug?: string }, defaults: CreateKondoDto}): Promise<findOrCreateType> {
        return await this.KondoRepositoryProvider.findOrCreate<Kondo>(findOrCreate);    
    }

    /**
     * Update 
     * 
     * @param updateKondoDto 
     * @param where {
                        where: {
                        lastName: null,
                        },
                    },
     * @returns 
     */
    async update(updateKondoDto: UpdateKondoDto, where): Promise<{}> {
        return await this.KondoRepositoryProvider.update<Kondo>(updateKondoDto, { where });
    }

    async destroy(): Promise<Number> {
        return await this.KondoRepositoryProvider.destroy<Kondo>();
    }

    async create(createKondoDto: CreateKondoDto): Promise<Kondo> {
        return await this.KondoRepositoryProvider.create<Kondo>(createKondoDto);
    }

}