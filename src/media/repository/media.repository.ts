import { Injectable, Inject } from "@nestjs/common";
import { MEDIA_REPOSITORY_PROVIDER } from "src/core/constants";
import { UpdateMediaDto } from "../dto/update-media.dto";
import { Media } from "../entities/media.entity";

type findOrCreateType = [Media | null, boolean];

@Injectable()
export class MediaRepository {

    constructor(@Inject(MEDIA_REPOSITORY_PROVIDER) private readonly MediaRepositoryProvider: typeof Media) { 
    }

    async find(): Promise<Media[]> {
        return await this.MediaRepositoryProvider.findAll<Media>();
    }

    async findOne(): Promise<Media> {
        return await this.MediaRepositoryProvider.findOne<Media>();
    }

    async findAll(): Promise<Media[]> {
        return await this.MediaRepositoryProvider.findAll<Media>();
    }

    /**
     * Find or Create
     * 
     * @param findOrCreate 
     *      Will try to find by id or slug.
     *      If nothing is found, will create.
     * @returns 
     */
    async findOrCreate(findOrCreate: { where: { id?: number, slug?: string }, defaults: Partial<Media>}): Promise<findOrCreateType> {
        return await this.MediaRepositoryProvider.findOrCreate<Media>(findOrCreate);    
    }

    /**
     * Update 
     * 
     * @param updateMediaDto 
     * @param where {
                        where: {
                        lastName: null,
                        },
                    },
     * @returns 
     */
    async update(updateMediaDto: UpdateMediaDto, where): Promise<object> {
        return await this.MediaRepositoryProvider.update<Media>(updateMediaDto, { where });
    }

    async destroy(): Promise<number> {
        return await this.MediaRepositoryProvider.destroy<Media>();
    }

    async create(createMediaDto: Partial<Media>): Promise<Media> {
        return await this.MediaRepositoryProvider.create<Media>(createMediaDto);
    }

}