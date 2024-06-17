import { Kondo } from "../entities/Kondo.entity";
import { CreateKondoDto } from "../dto/create-kondo.dto";
import { UpdateKondoDto } from "../dto/update-Kondo.dto";
import { findOrCreateType } from "../types/findorcreate.type";
export declare class KondoRepository {
    private readonly KondoRepositoryProvider;
    constructor(KondoRepositoryProvider: typeof Kondo);
    find(): Promise<Kondo[]>;
    findOne(): Promise<Kondo>;
    findAll(): Promise<Kondo[]>;
    findOrCreate(findOrCreate: {
        where: {
            id?: number;
            slug?: string;
        };
        defaults: CreateKondoDto;
    }): Promise<findOrCreateType>;
    update(updateKondoDto: UpdateKondoDto, where: any): Promise<object>;
    destroy(): Promise<number>;
    create(createKondoDto: CreateKondoDto): Promise<Kondo>;
}
