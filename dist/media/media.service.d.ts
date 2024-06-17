import { Media } from './entities/media.entity';
import { SearchMediaDto } from './dto/search-media.dto';
export declare class MediaService {
    private readonly MediaRepository;
    constructor(MediaRepository: typeof Media);
    findMediasOfKondo(kondoId: string): Promise<Media[]>;
    findBy(searchMediaDto: SearchMediaDto): Promise<Media>;
    findAll(): Promise<Media[]>;
}
