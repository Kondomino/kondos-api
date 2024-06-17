import { MediaService } from './media.service';
import { SearchMediaDto } from './dto/search-media.dto';
export declare class MediaController {
    private readonly mediaService;
    constructor(mediaService: MediaService);
    findMediasOfKondo(kondoId: string): Promise<import("./entities/media.entity").Media[]>;
    findOne(searchMediaDto: SearchMediaDto): Promise<import("./entities/media.entity").Media>;
}
