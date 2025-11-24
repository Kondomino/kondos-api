import { Type } from "class-transformer";
import { IsEnum, IsOptional, IsInt, Min, Max } from "class-validator";
import { Order } from "./order.type";

export class PageOptionsDto {
    @IsEnum(Order)
    @IsOptional()
    readonly order?: Order = Order.DSC;
  
    @Type(() => Number)
    @IsInt()
    @Min(1)
    @IsOptional()
    readonly page?: number = 1;
  
    @Type(() => Number)
    @IsInt()
    @Min(1)
    @Max(50)
    @IsOptional()
    readonly take?: number = 12;
  
    get skip(): number {
      return (this.page - 1) * this.take;
    }
  }