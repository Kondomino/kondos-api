"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PageMetaDto = void 0;
class PageMetaDto {
    constructor({ pageOptionsDto, itemCount }) {
        this.page = pageOptionsDto.page;
        this.take = pageOptionsDto.take;
        this.itemCount = itemCount;
        this.pageCount = Math.ceil(this.itemCount / this.take);
        this.hasPreviousPage = this.page > 1;
        this.hasNextPage = this.page < this.pageCount;
    }
}
exports.PageMetaDto = PageMetaDto;
