import { Kondo } from './entities/Kondo.entity';
import { UpdateKondoDto } from './dto/update-Kondo.dto';
import { CreateKondoDto } from './dto/create-kondo.dto';
import { findOrCreateType } from './types/findorcreate.type';
import { SearchKondoDto } from './dto/search-kondo.dto';
import { SlugifyService } from '../utils/slugify/slugify.service';
export declare class KondoService {
    private readonly KondoRepository;
    private slugify;
    constructor(KondoRepository: typeof Kondo, slugify: SlugifyService);
    create(Kondo: CreateKondoDto): Promise<findOrCreateType>;
    findOneByEmail(email: string): Promise<Kondo>;
    findOne(id: number): Promise<Kondo>;
    findBy(searchKondoDto: SearchKondoDto): Promise<Kondo>;
    findActives(): Promise<Kondo[]>;
    findAll(): Promise<Kondo[]>;
    update(id: number, Kondo: UpdateKondoDto): Promise<Kondo>;
    deactivateKondo(id: number): Promise<Kondo>;
}
