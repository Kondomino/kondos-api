import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { Kondo } from './entities/Kondo.entity';
import { UpdateKondoDto } from './dto/update-Kondo.dto';
import { CreateKondoDto } from './dto/create-kondo.dto';
import { KONDO_REPOSITORY_PROVIDER } from 'src/core/constants';
import { SlugifyService } from 'src/utils/slugify/slugify.service';
import { findOrCreateType } from './types/findorcreate.type';
import { SearchKondoDto } from './dto/search-kondo.dto';

@Injectable()
export class KondoService {

    constructor(
        @Inject(KONDO_REPOSITORY_PROVIDER) private readonly KondoRepository: typeof Kondo,
        private slugify: SlugifyService
    ) { }

    async create(Kondo: CreateKondoDto): Promise<findOrCreateType> {

        try {
            Kondo.slug = this.slugify.run(Kondo.name);

            return await this.KondoRepository.findOrCreate({
                where: { slug: Kondo.slug },
                defaults: Kondo
            });
        }
        catch (error) {
            console.log('KondoService error: ', error);
        }
    }

    async findOneByEmail(email: string): Promise<Kondo> {
        return await this.KondoRepository.findOne<Kondo>({ where: { email } });
    }
    async findOne(id: number): Promise<Kondo> {
        return await this.KondoRepository.findOne<Kondo>({ where: { id } });
    }
    async findBy(searchKondoDto: SearchKondoDto): Promise<Kondo> {
        const { name, slug, email } = searchKondoDto;

        if (name)
            return await this.KondoRepository.findOne<Kondo>({ where: { name } });
        else if (slug)
            return await this.KondoRepository.findOne<Kondo>({ where: { slug } });
        else if (email)
            return this.findOneByEmail(email);
    }
    async findActives(): Promise<Kondo[]> {
        return await this.KondoRepository.findAll<Kondo>({ where: { active: true }});
    }
    async findAll(): Promise<Kondo[]> {
        return await this.KondoRepository.findAll<Kondo>({});
    }

    async update(id: number, Kondo: UpdateKondoDto): Promise<Kondo> {
        const KondoFound = await this.findOne(id);

        if (!KondoFound)
            throw new NotFoundException();

        return await KondoFound.update({ ...Kondo });
    }

    async deactivateKondo(id: number): Promise<Kondo> {
        const KondoFound = await this.findOne(id);

        if (!KondoFound)
            throw new NotFoundException();

        return await KondoFound.update({ active: false});
    }
}