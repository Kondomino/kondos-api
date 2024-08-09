/* eslint-disable @typescript-eslint/no-unused-vars */
import { Injectable, Inject } from "@nestjs/common";
import { Kondo } from "../entities/kondo.entity";
import { KONDO_REPOSITORY_PROVIDER } from "src/core/constants";
import { UpdateKondoDto } from "../dto/update-kondo.dto";
import { findOrCreateType } from "../types/findorcreate.type";
import { FindOptions } from "sequelize";
import { SearchKondoDto } from "../dto/search-kondo.dto";
import { PaginationQuery } from "../../core/pagination/pagination.query.type";
import { Op } from "sequelize";
import { Like } from "../../like/entities/like.entity";
import sequelize from "sequelize";

@Injectable()
export class KondoRepository {

    constructor(@Inject(KONDO_REPOSITORY_PROVIDER) private readonly KondoRepositoryProvider: typeof Kondo) { 
    }

    async findOne(where: FindOptions): Promise<Kondo> {
        console.log('kondo.repository findOne', where);
        return await this.KondoRepositoryProvider.findOne<Kondo>(where);
    }

    async findAll(searchKondoDto: SearchKondoDto): Promise<Kondo[]> {
        // eslint-disable-next-line prefer-const
        let { take, order, page, name, slug, active, status, search } = searchKondoDto;

        // eslint-disable-next-line prefer-const
        let query: PaginationQuery = {
            attributes: ['Kondo.*', [sequelize.fn('COUNT', sequelize.col('likes.kondoId')), 'likes']],
            limit: take,
            where: { active, status },
            include: { model: Like, as: 'likes', required: false, duplicating: false, attributes: [] },
            group: 'Kondo.id'
        };

        if (search) {
            const queryPhraseArray = search.split(' ');
            query.where = Object.assign(query.where, { 
                [Op.or]:
                    [
                        { name: { [Op.iLike]: { [Op.any]: queryPhraseArray.map(item=> `%${item}%`) }}},
                        { city: { [Op.iLike]: { [Op.any]: queryPhraseArray.map(item=> `%${item}%`) }}},
                        { neighborhood: { [Op.iLike]: { [Op.any]: queryPhraseArray.map(item=> `%${item}%`) }}}
                    ] 
             });
        }
        
        if (name) {
            query.where = Object.assign(query.where, { name });
        }

        if (slug) {
            query.where = Object.assign(query.where, { slug });
        }

        if (order) {
            query.order = [['id', searchKondoDto.order]];
        }

        page = page? page -1 : 0;
        query.offset = page * searchKondoDto.take;
        
        return await this.KondoRepositoryProvider.findAll<Kondo>(query);
    }

    /**
     * Find or Create
     * 
     * @param findOrCreate 
     *      Will try to find by id or slug.
     *      If nothing is found, will create.
     * @returns 
     */
    async findOrCreate(findOrCreate: { where: { id?: number, slug?: string }, defaults: Partial<Kondo>}): Promise<findOrCreateType> {
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
    async update(updateKondoDto: UpdateKondoDto, where): Promise<object> {
        return await this.KondoRepositoryProvider.update<Kondo>(updateKondoDto, { where });
    }

    async destroy(): Promise<number> {
        return await this.KondoRepositoryProvider.destroy<Kondo>();
    }

    async create(createKondoDto: Partial<Kondo>): Promise<Kondo> {
        return await this.KondoRepositoryProvider.create<Kondo>(createKondoDto);
    }
}