import { Injectable, Inject } from "@nestjs/common";
import { LIKE_REPOSITORY_PROVIDER } from "src/core/constants";
import { UpdateLikeDto } from "../dto/update-like.dto";
import { Like } from "../entities/like.entity";

type findOrCreateType = [Like | null, boolean];

@Injectable()
export class LikeRepository {

    constructor(@Inject(LIKE_REPOSITORY_PROVIDER) private readonly LikeRepositoryProvider: typeof Like) { 
    }

    async find(): Promise<Like[]> {
        return await this.LikeRepositoryProvider.findAll<Like>();
    }

    async findOne(): Promise<Like> {
        return await this.LikeRepositoryProvider.findOne<Like>();
    }

    async findAll(): Promise<Like[]> {
        return await this.LikeRepositoryProvider.findAll<Like>();
    }

    /**
     * Find or Create
     * 
     * @param findOrCreate 
     *      Will try to find by id or slug.
     *      If nothing is found, will create.
     * @returns 
     */
    async findOrCreate(findOrCreate: { where: { id?: number, slug?: string }, defaults: Partial<Like>}): Promise<findOrCreateType> {
        return await this.LikeRepositoryProvider.findOrCreate<Like>(findOrCreate);    
    }

    /**
     * Update 
     * 
     * @param updateLikeDto 
     * @param where {
                        where: {
                        lastName: null,
                        },
                    },
     * @returns 
     */
    async update(updateLikeDto: UpdateLikeDto, where): Promise<object> {
        return await this.LikeRepositoryProvider.update<Like>(updateLikeDto, { where });
    }

    async destroy(): Promise<number> {
        return await this.LikeRepositoryProvider.destroy<Like>();
    }

    async create(createLikeDto: Partial<Like>): Promise<Like> {
        return await this.LikeRepositoryProvider.create<Like>(createLikeDto);
    }

}