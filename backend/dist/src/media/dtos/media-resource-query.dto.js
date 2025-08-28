"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MediaResourceQueryDto = void 0;
const swagger_1 = require("@nestjs/swagger");
class MediaResourceQueryDto {
    page = 1;
    limit = 10;
    search;
    type;
    genre;
    minRating;
    maxRating;
    sortBy = 'createdAt';
    sortOrder = 'DESC';
}
exports.MediaResourceQueryDto = MediaResourceQueryDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: '页码', default: 1 }),
    __metadata("design:type", Number)
], MediaResourceQueryDto.prototype, "page", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '每页数量', default: 10 }),
    __metadata("design:type", Number)
], MediaResourceQueryDto.prototype, "limit", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '搜索关键词', required: false }),
    __metadata("design:type", String)
], MediaResourceQueryDto.prototype, "search", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '影视类型', required: false }),
    __metadata("design:type", String)
], MediaResourceQueryDto.prototype, "type", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '类型标签', required: false }),
    __metadata("design:type", String)
], MediaResourceQueryDto.prototype, "genre", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '最低评分', required: false }),
    __metadata("design:type", Number)
], MediaResourceQueryDto.prototype, "minRating", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '最高评分', required: false }),
    __metadata("design:type", Number)
], MediaResourceQueryDto.prototype, "maxRating", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '排序字段', default: 'createdAt' }),
    __metadata("design:type", String)
], MediaResourceQueryDto.prototype, "sortBy", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '排序方式', enum: ['ASC', 'DESC'], default: 'DESC' }),
    __metadata("design:type", String)
], MediaResourceQueryDto.prototype, "sortOrder", void 0);
//# sourceMappingURL=media-resource-query.dto.js.map