import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { KONDO_REPOSITORY } from 'src/core/constants';
import { Kondo } from './entities/Kondo.entity';
import { UpdateKondoDto } from './dto/update-Kondo.dto';
import { CreateKondoDto } from './dto/create-kondo.dto';

@Injectable()
export class KondoService {

    constructor(@Inject(KONDO_REPOSITORY) private readonly KondoRepository: typeof Kondo) { }

    async create(Kondo: CreateKondoDto): Promise<Kondo> {
        return await this.KondoRepository.create<Kondo>(Kondo);
    }

    async findOneByEmail(email: string): Promise<Kondo> {
        return await this.KondoRepository.findOne<Kondo>({ where: { email } });
    }

    async findOne(id: number): Promise<Kondo> {
        return await this.KondoRepository.findOne<Kondo>({ where: { id } });
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