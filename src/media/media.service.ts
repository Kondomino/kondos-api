import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { MEDIA_REPOSITORY_PROVIDER, KONDO_REPOSITORY_PROVIDER } from '../core/constants';
import { Media } from './entities/media.entity';
import { SearchMediaDto } from './dto/search-media.dto';
import { Kondo } from '../kondo/entities/kondo.entity';
import { KondoRepository } from '../kondo/repository/kondo.repository';

@Injectable()
export class MediaService {

    constructor(
        @Inject(MEDIA_REPOSITORY_PROVIDER) private readonly MediaRepository: typeof Media,
        private readonly kondoRepository: KondoRepository
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
        return await this.MediaRepository.findAll<Media>({ 
            where: { 
                kondoId,
                status: 'final' // Only return active media, exclude soft-deleted (status='draft')
            }
        });
    }
    async findBy(searchMediaDto: SearchMediaDto): Promise<Media> {
        const { filename } = searchMediaDto;

        return await this.MediaRepository.findOne<Media>({ where: { filename } });
    }
    async findAll(): Promise<Media[]> {
        return await this.MediaRepository.findAll<Media>({});
    }

    async findOne(id: number): Promise<Media> {
        return await this.MediaRepository.findOne<Media>({ where: { id } });
    }

    async remove(id: number): Promise<{ success: boolean; message: string }> {
        // Find media
        const media = await this.findOne(id);
        
        if (!media) {
            throw new NotFoundException(`Media with ID ${id} not found`);
        }

        // Soft delete: Update status to 'draft'
        await media.update({ status: 'draft' });

        // Check if this media was the kondo's featured_image
        const kondo = await this.kondoRepository.findOneBaked(media.kondoId);
        
        if (kondo && kondo.featured_image === media.filename) {
            // Clear featured_image from kondo
            kondo.featured_image = null;
            await kondo.save();
        }

        return {
            success: true,
            message: 'Image deleted successfully'
        };
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