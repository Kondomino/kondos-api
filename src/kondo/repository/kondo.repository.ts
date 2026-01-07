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
import { Media } from "../../media/entities/media.entity";
import sequelize from "sequelize";
import { KondoCountResponse, KondoSitemapItem, SitemapQueryDto } from "../dto/sitemap-query.dto";

@Injectable()
export class KondoRepository {

    constructor(@Inject(KONDO_REPOSITORY_PROVIDER) private readonly KondoRepositoryProvider: typeof Kondo) { 
    }

    async findOne(where: FindOptions): Promise<Kondo> {
        //console.log('kondo.repository findOne', where);
        return await this.KondoRepositoryProvider.findOne<Kondo>(where);
    }

    async findOneBaked(id: number): Promise<Kondo> {
        const kondo = await this.KondoRepositoryProvider.findOne<Kondo>({ 
            where: { id },
            include: [{ model: Media, as: 'medias', required: false, attributes: ['filename', 'storage_url'] }]
        });
        if (kondo) {
            // Ensure Sequelize recognizes this as an existing record
            kondo.isNewRecord = false;
        }
        return kondo;
    }

    async findAll(searchKondoDto: SearchKondoDto): Promise<Kondo[]> {
        // eslint-disable-next-line prefer-const
        let { take, order, page, name, slug, active, status, search, conveniences, randomize, includeHighlighted, includeInactive, allStatuses } = searchKondoDto;

        console.log('findAll');
        console.log('allStatuses', allStatuses);
        console.log('active', active);
        // eslint-disable-next-line prefer-const
        let query: PaginationQuery = {
            attributes: ['Kondo.*', [sequelize.fn('COUNT', sequelize.col('likes.kondoId')), 'likes']],
            limit: take,
            where: { active, status },
            include: [
                { model: Like, as: 'likes', required: false, duplicating: false, attributes: [] },
                { model: Media, as: 'medias', required: false, attributes: ['filename', 'storage_url'] }
            ],
            group: ['Kondo.id', 'medias.id'] as any
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
        
        if (conveniences) {
            const conveniencesArray = conveniences.split(',');
            for (const item of conveniencesArray) {
                query.where[item] = true;
            }
        }

        if (name) {
            query.where = Object.assign(query.where, { name });
        }

        if (slug) {
            query.where = Object.assign(query.where, { slug });
        }

        if (includeHighlighted) {
            delete query.where.highlight;
        }
        
        if (includeInactive) {
            delete query.where.active;
        }

        if (allStatuses) {
            delete query.where.status;
        }
        console.log('where', query.where);

        // TODO: create an orderByField = 'field'
        if (randomize) {
            query.order = [sequelize.literal('highlight DESC, RANDOM()')];
        }
        else if (order) {
            query.order = [['highlight', 'DESC'], ['id', searchKondoDto.order]];
        }
        else {
            query.order = [['highlight', 'DESC'], ['updatedAt', 'DESC']];
        }

        page = page? page -1 : 0;
        query.offset = page * searchKondoDto.take;
        
        return await this.KondoRepositoryProvider.findAll<Kondo>(query);
    }

    async findAllWithCount(searchKondoDto: SearchKondoDto): Promise<{ data: Kondo[], count: number }> {
        // eslint-disable-next-line prefer-const
        let { take, order, page, name, slug, active, status, search, conveniences, randomize, highlight, includeHighlighted, includeInactive, allStatuses } = searchKondoDto;

        console.log('findAllWithCount');
        console.log('allStatuses', allStatuses);
        console.log('active', active);
        // Build where clause for both queries
        // eslint-disable-next-line prefer-const
        let whereClause: any = { active, status, highlight };

        if (search) {
            const queryPhraseArray = search.split(' ');
            whereClause = Object.assign(whereClause, { 
                [Op.or]:
                    [
                        { name: { [Op.iLike]: { [Op.any]: queryPhraseArray.map(item=> `%${item}%`) }}},
                        { city: { [Op.iLike]: { [Op.any]: queryPhraseArray.map(item=> `%${item}%`) }}},
                        { neighborhood: { [Op.iLike]: { [Op.any]: queryPhraseArray.map(item=> `%${item}%`) }}}
                    ] 
             });
        }
        
        if (conveniences) {
            const conveniencesArray = conveniences.split(',');
            for (const item of conveniencesArray) {
                whereClause[item] = true;
            }
        }

        if (name) {
            whereClause = Object.assign(whereClause, { name });
        }

        if (slug) {
            whereClause = Object.assign(whereClause, { slug });
        }

        if (includeHighlighted) {
            delete whereClause.highlight;
        }

        if (includeInactive) {
            delete whereClause.active;
        }

        if (allStatuses) {
            delete whereClause.status;
        }
        console.log('where', whereClause);
        // Get total count (without pagination)
        const count = await this.KondoRepositoryProvider.count({ where: whereClause });

        // Build query for data
        // eslint-disable-next-line prefer-const
        let query: PaginationQuery = {
            attributes: {
                include: [
                    [sequelize.fn('COUNT', sequelize.col('likes.kondoId')), 'likes']
                ]
            },
            limit: take,
            where: whereClause,
            include: [
                { model: Like, as: 'likes', required: false, duplicating: false, attributes: [] },
                { model: Media, as: 'medias', required: false, attributes: ['filename', 'storage_url'] }
            ],
            group: ['Kondo.id', 'medias.id'],
            subQuery: false
        } as any;

        // TODO: create an orderByField = 'field'
        if (randomize) {
            query.order = [sequelize.literal('highlight DESC, RANDOM()')];
        }
        else if (order) {
            query.order = [['highlight', 'DESC'], ['id', searchKondoDto.order]];
        }
        else {
            query.order = [['highlight', 'DESC'], ['updatedAt', 'DESC']];
        }

        page = page? page -1 : 0;
        query.offset = page * searchKondoDto.take;
        
        const data = await this.KondoRepositoryProvider.findAll<Kondo>(query);

        return { data, count };
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
        //console.log('....findOrCreate ', findOrCreate.where);
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

    async getCount(): Promise<KondoCountResponse> {
        const result = await this.KondoRepositoryProvider.findOne({
            attributes: [
                [sequelize.fn('COUNT', sequelize.literal('CASE WHEN highlight = true THEN 1 END')), 'highlighted'],
                [sequelize.fn('COUNT', sequelize.literal('CASE WHEN highlight = false OR highlight IS NULL THEN 1 END')), 'regular']
            ],
            where: { active: true },
            raw: true
        });

        return {
            highlighted: parseInt(result['highlighted'] as string) || 0,
            regular: parseInt(result['regular'] as string) || 0
        };
    }

    async getSitemapData(sitemapQueryDto: SitemapQueryDto): Promise<KondoSitemapItem[]> {
        const { page = 1, limit = 50000, highlighted } = sitemapQueryDto;
        const offset = (page - 1) * limit;

        const where: any = { active: true };

        if (highlighted === '1') {
            where.highlight = true;
        } else if (highlighted === '0') {
            where[Op.or] = [
                { highlight: false },
                { highlight: null }
            ];
        }

        const results = await this.KondoRepositoryProvider.findAll({
            attributes: ['slug', 'updatedAt', 'highlight'],
            where,
            order: [['updatedAt', 'DESC']],
            limit,
            offset,
            raw: true
        });

        return results as any as KondoSitemapItem[];
    }
}