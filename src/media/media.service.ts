import { Injectable, Inject } from '@nestjs/common';
import { MEDIA_REPOSITORY_PROVIDER } from '../core/constants';
import { Media } from './entities/media.entity';
import { SearchMediaDto } from './dto/search-media.dto';

@Injectable()
export class MediaService {

    constructor(
        @Inject(MEDIA_REPOSITORY_PROVIDER) private readonly MediaRepository: typeof Media
    ) { }

    /*
    async create(Media: CreateMediaDto): Promise<findOrCreateType> {

        try {
            //Media.slug = this.slugify.run(Media.name);

            return await this.MediaRepository.findOrCreate({
                where: { slug: Media.slug },
                defaults: Media
            });
        }
        catch (error) {
            console.log('MediaService error: ', error);
        }
    }
*/
/*
    async findOneByEmail(email: string): Promise<Media> {
        return await this.MediaRepository.findOne<Media>({ where: { email } });
    }
    
    async findOne(id: number): Promise<Media> {
        return await this.MediaRepository.findOne<Media>({ where: { id } });
    }
    */
    
    async findMediasOfKondo(kondoId: string): Promise<Media[]> {
        return await this.MediaRepository.findAll<Media>({ where: { kondoId }});
    }
    async findBy(searchMediaDto: SearchMediaDto): Promise<Media> {
        const { filename } = searchMediaDto;

        return await this.MediaRepository.findOne<Media>({ where: { filename } });
    }
    async findAll(): Promise<Media[]> {
        return await this.MediaRepository.findAll<Media>({});
    }

    /*
    async update(id: number, Media: UpdateMediaDto): Promise<Media> {
        const MediaFound = await this.findOne(id);

        if (!MediaFound)
            throw new NotFoundException();

        return await MediaFound.update({ ...Media });
    }

    async deactivateMedia(id: number): Promise<Media> {
        const MediaFound = await this.findOne(id);

        if (!MediaFound)
            throw new NotFoundException();

        return await MediaFound.update({ active: false});
    }
    */
}