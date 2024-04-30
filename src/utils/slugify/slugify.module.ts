import { Module } from "@nestjs/common";
import { SlugifyService } from "./slugify.service";

@Module({
    providers: [SlugifyService],
    exports: [SlugifyService]
  })
  export class SlugifyModule {}