import { IsString } from "class-validator";

export class SearchMediaDto {

    @IsString()
    filename: string;
}
