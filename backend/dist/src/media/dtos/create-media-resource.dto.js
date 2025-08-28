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
exports.CreateMediaResourceDto = void 0;
const class_validator_1 = require("class-validator");
const media_resource_entity_1 = require("../../entities/media-resource.entity");
const swagger_1 = require("@nestjs/swagger");
class CreateMediaResourceDto {
    title;
    description;
    type;
    director;
    actors;
    genres;
    releaseDate;
    quality = media_resource_entity_1.MediaQuality.HD;
    poster;
    backdrop;
    rating = 0;
    source;
    episodeCount;
    downloadUrls;
}
exports.CreateMediaResourceDto = CreateMediaResourceDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: '影视标题' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateMediaResourceDto.prototype, "title", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '简介', required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateMediaResourceDto.prototype, "description", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '影视类型', enum: media_resource_entity_1.MediaType }),
    (0, class_validator_1.IsEnum)(media_resource_entity_1.MediaType),
    __metadata("design:type", String)
], CreateMediaResourceDto.prototype, "type", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '导演', required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateMediaResourceDto.prototype, "director", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '主演', required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateMediaResourceDto.prototype, "actors", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '类型标签', required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsString)({ each: true }),
    __metadata("design:type", Array)
], CreateMediaResourceDto.prototype, "genres", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '上映日期', required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDate)(),
    __metadata("design:type", Date)
], CreateMediaResourceDto.prototype, "releaseDate", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '视频质量', enum: media_resource_entity_1.MediaQuality, default: media_resource_entity_1.MediaQuality.HD }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(media_resource_entity_1.MediaQuality),
    __metadata("design:type", String)
], CreateMediaResourceDto.prototype, "quality", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '海报URL', required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateMediaResourceDto.prototype, "poster", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '背景图URL', required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateMediaResourceDto.prototype, "backdrop", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '评分', minimum: 0, maximum: 10, default: 0 }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    (0, class_validator_1.Max)(10),
    __metadata("design:type", Number)
], CreateMediaResourceDto.prototype, "rating", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '来源平台', required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateMediaResourceDto.prototype, "source", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '剧集数', required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], CreateMediaResourceDto.prototype, "episodeCount", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '下载链接', required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsString)({ each: true }),
    __metadata("design:type", Array)
], CreateMediaResourceDto.prototype, "downloadUrls", void 0);
//# sourceMappingURL=create-media-resource.dto.js.map