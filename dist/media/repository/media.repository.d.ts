import { CreateMediaDto } from "../dto/create-media.dto";
import { UpdateMediaDto } from "../dto/update-media.dto";
import { Media } from "../entities/media.entity";
type findOrCreateType = [Media | null, boolean];
export declare class MediaRepository {
    private readonly MediaRepositoryProvider;
    constructor(MediaRepositoryProvider: typeof Media);
    find(): Promise<Media[]>;
    findOne(): Promise<Media>;
    findAll(): Promise<Media[]>;
    findOrCreate(findOrCreate: {
        where: {
            id?: number;
            slug?: string;
        };
        defaults: CreateMediaDto;
    }): Promise<findOrCreateType>;
    update(updateMediaDto: UpdateMediaDto, where: any): Promise<object>;
    destroy(): Promise<number>;
    create(createMediaDto: CreateMediaDto): Promise<Media>;
}
export {};
