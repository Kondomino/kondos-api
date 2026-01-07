import { Injectable, NotFoundException } from '@nestjs/common';
import { Kondo } from './entities/kondo.entity';
import { UpdateKondoDto } from './dto/update-kondo.dto';
import { CreateKondoDto } from './dto/create-kondo.dto';
import { findOrCreateType } from './types/findorcreate.type';
import { SearchKondoDto } from './dto/search-kondo.dto';
import { SlugifyService } from '../utils/slugify/slugify.service';
import { KondoRepository } from './repository/kondo.repository';
import { KondoConveniencesType } from './entities/kondo.conveniences.abstract.entity';
import { KondoCountResponse, KondoSitemapItem, SitemapQueryDto } from './dto/sitemap-query.dto';
import { PageDto } from '../core/pagination/page.dto';
import { PageMetaDto } from '../core/pagination/page.meta.dto';
import { DigitalOceanSpacesService } from '../whatsapp/services/digital-ocean-spaces.service';
import { Media } from '../media/entities/media.entity';
import { Inject } from '@nestjs/common';
import { MEDIA_REPOSITORY_PROVIDER } from '../core/constants';

@Injectable()
export class KondoService {

    constructor(
        private slugify: SlugifyService,
        private readonly KondoRepository: KondoRepository,
        private readonly digitalOceanSpacesService: DigitalOceanSpacesService,
        @Inject(MEDIA_REPOSITORY_PROVIDER) private readonly MediaRepository: typeof Media
    ) {}

    async create(Kondo: CreateKondoDto): Promise<findOrCreateType> {

        try {
            Kondo.slug = this.slugify.run(Kondo.name);

            return await this.KondoRepository.findOrCreate({
                where: { slug: Kondo.slug },
                defaults: Kondo
            });
        }
        catch (error) {
            console.log('KondoService error: ', error);
        }
    }

    async findOne(id: number): Promise<Kondo> {
        return await this.KondoRepository.findOne({ where: { id } });
    }

    async findBy(searchKondoDto: SearchKondoDto): Promise<Kondo> {
        const { name, slug, email } = searchKondoDto;
        if (name)
            return await this.KondoRepository.findOne({ where: { name } });
        else if (slug)
            return await this.KondoRepository.findOne({ where: { slug } });
        else if (email)
            return await this.KondoRepository.findOne({ where: { email } });
    }
    async findActives(searchKondoDto: SearchKondoDto): Promise<Kondo[]> {
        searchKondoDto.active = true;
        return await this.KondoRepository.findAll(searchKondoDto);
    }
    async findAll(searchKondoDto: SearchKondoDto): Promise<PageDto<Kondo>> {
        const { data, count } = await this.KondoRepository.findAllWithCount(searchKondoDto);
        
        const pageMetaDto = new PageMetaDto({
            pageOptionsDto: searchKondoDto,
            itemCount: count
        });

        return new PageDto(data, pageMetaDto);
    }
    async getConveniences(): Promise<KondoConveniencesType[]> {
        const kondo = new Kondo();

        return kondo.getAllConveniences();
    }
    
    async update(id: number, updateKondoDto: UpdateKondoDto): Promise<Kondo> {
        const kondoFound = await this.KondoRepository.findOneBaked(id);

        if (!kondoFound)
            throw new NotFoundException();

        Object.assign(kondoFound, updateKondoDto);
        return await kondoFound.save();
    }

    async deactivateKondo(id: number): Promise<Kondo> {
        const kondoFound = await this.KondoRepository.findOneBaked(id);

        if (!kondoFound)
            throw new NotFoundException();

        kondoFound.active = false;
        return await kondoFound.save();
    }

    async updateFeaturedImage(id: number, filename: string): Promise<Kondo> {
        const kondoFound = await this.KondoRepository.findOneBaked(id);

        if (!kondoFound) {
            throw new NotFoundException(`Kondo with ID ${id} not found`);
        }

        // Validate that the image belongs to this kondo
        const mediaExists = await this.MediaRepository.findOne({
            where: { kondoId: id, filename: filename }
        });

        if (!mediaExists) {
            throw new NotFoundException(`Media file "${filename}" not found for this kondo`);
        }

        kondoFound.featured_image = filename;
        return await kondoFound.save();
    }

    async getCount(): Promise<KondoCountResponse> {
        return await this.KondoRepository.getCount();
    }

    async getSitemapData(sitemapQueryDto: SitemapQueryDto): Promise<KondoSitemapItem[]> {
        return await this.KondoRepository.getSitemapData(sitemapQueryDto);
    }

    async uploadMedia(kondoId: number, files: Express.Multer.File[]): Promise<{ success: boolean; message: string; data: Media[] }> {
        // Find kondo to get slug
        const kondo = await this.findOne(kondoId);
        if (!kondo) {
            throw new NotFoundException(`Kondo with ID ${kondoId} not found`);
        }

        const uploadedMedia: Media[] = [];
        const errors: string[] = [];

        for (const file of files) {
            try {
                // Generate unique filename
                const timestamp = Date.now();
                const randomSuffix = Math.random().toString(36).substring(7);
                const fileExtension = file.originalname.split('.').pop();
                const uniqueFilename = `${timestamp}-${randomSuffix}.${fileExtension}`;
                
                // Upload to DigitalOcean Spaces
                const key = `kondos/${kondo.slug}/${uniqueFilename}`;
                const uploadResult = await this.digitalOceanSpacesService.uploadFile(
                    file.buffer,
                    key,
                    file.mimetype,
                    { kondoId: kondoId.toString() }
                );

                if (uploadResult.success) {
                    // Create Media entity
                    const media = await this.MediaRepository.create({
                        filename: uniqueFilename,
                        type: 'image',
                        status: 'final',
                        storage_url: uploadResult.url,
                        kondoId: kondoId
                    });

                    uploadedMedia.push(media);
                } else {
                    errors.push(`${file.originalname}: ${uploadResult.error}`);
                }
            } catch (error) {
                errors.push(`${file.originalname}: ${error.message}`);
            }
        }

        if (errors.length > 0 && uploadedMedia.length === 0) {
            throw new Error(`All uploads failed: ${errors.join(', ')}`);
        }

        return {
            success: true,
            message: `${uploadedMedia.length} image(s) uploaded successfully${errors.length > 0 ? ` (${errors.length} failed)` : ''}`,
            data: uploadedMedia
        };
    }
}