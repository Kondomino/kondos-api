import { Injectable, NotFoundException } from '@nestjs/common';
import { Kondo } from './entities/kondo.entity';
import { UpdateKondoDto } from './dto/update-kondo.dto';
import { CreateKondoDto } from './dto/create-kondo.dto';
import { findOrCreateType } from './types/findorcreate.type';
import { SearchKondoDto } from './dto/search-kondo.dto';
import { SlugifyService } from '../utils/slugify/slugify.service';
import { KondoRepository } from './repository/kondo.repository';

@Injectable()
export class KondoService {

    constructor(
        private slugify: SlugifyService,
        private readonly KondoRepository: KondoRepository
    ) {}

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

    async findOne(id: number): Promise<Kondo> {
        return await this.KondoRepository.findOne({ where: { id } });
    }
    async findBy(searchKondoDto: SearchKondoDto): Promise<Kondo> {
        const { name, slug, email } = searchKondoDto;

        if (name)
            return await this.KondoRepository.findOne({ where: { name } });
        else if (slug)
            return await this.KondoRepository.findOne({ where: { slug } });
        else if (email)
            return await this.KondoRepository.findOne({ where: { email } });
    }
    async findActives(searchKondoDto: SearchKondoDto): Promise<Kondo[]> {
        searchKondoDto.active = true;
        return await this.KondoRepository.findAll(searchKondoDto);
    }
    async findAll(searchKondoDto: SearchKondoDto): Promise<Kondo[]> {
        return await this.KondoRepository.findAll(searchKondoDto);
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