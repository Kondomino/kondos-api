import { IsNotEmpty, IsString } from 'class-validator';

export class UpdateFeaturedImageDto {
    @IsString()
    @IsNotEmpty()
    readonly featured_image: string;
}
