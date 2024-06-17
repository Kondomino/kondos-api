import { CreateKondoDto } from './dto/create-kondo.dto';
import { SearchKondoDto } from './dto/search-kondo.dto';
import { UpdateKondoDto } from './dto/update-Kondo.dto';
import { KondoService } from './kondo.service';
export declare class KondoController {
    private readonly kondoService;
    constructor(kondoService: KondoService);
    create(createKondoDto: CreateKondoDto): Promise<import("./types/findorcreate.type").findOrCreateType>;
    findAll(): Promise<import("./entities/Kondo.entity").Kondo[]>;
    findOne(id: string): Promise<import("./entities/Kondo.entity").Kondo>;
    findBy(searchKondoDto: SearchKondoDto): Promise<import("./entities/Kondo.entity").Kondo>;
    update(id: string, updateKondoDto: UpdateKondoDto): Promise<import("./entities/Kondo.entity").Kondo>;
    remove(id: string): Promise<import("./entities/Kondo.entity").Kondo>;
}
