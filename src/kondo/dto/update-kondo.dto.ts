import { PartialType } from '@nestjs/mapped-types';
import { CreateKondoDto } from './create-kondo.dto';

export class UpdateKondoDto extends PartialType(CreateKondoDto) {}
