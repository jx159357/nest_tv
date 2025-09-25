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
exports.ErrorResponse = exports.MediaDetailResponseDto = exports.MediaListResponseDto = exports.MediaResourceDto = void 0;
const swagger_1 = require("@nestjs/swagger");
class MediaResourceDto {
    id;
    title;
    description;
    type;
    quality;
    tags;
    coverUrl;
    playUrl;
    duration;
    rating;
    ratingCount;
    releaseDate;
    isActive;
    createdAt;
    updatedAt;
}
exports.MediaResourceDto = MediaResourceDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: '影视资源ID', example: 1 }),
    __metadata("design:type", Number)
], MediaResourceDto.prototype, "id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '影视标题', example: '复仇者联盟4' }),
    __metadata("design:type", String)
], MediaResourceDto.prototype, "title", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '影视描述', example: '经典的超级英雄电影' }),
    __metadata("design:type", String)
], MediaResourceDto.prototype, "description", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '影视类型',
        example: 'movie',
        enum: ['movie', 'tv', 'variety', 'documentary'],
    }),
    __metadata("design:type", String)
], MediaResourceDto.prototype, "type", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '视频质量',
        example: '1080p',
        enum: ['1080p', '720p', '480p', '360p'],
    }),
    __metadata("design:type", String)
], MediaResourceDto.prototype, "quality", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '影视标签', example: ['动作', '科幻'], isArray: true }),
    __metadata("design:type", Array)
], MediaResourceDto.prototype, "tags", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '影视封面URL', example: 'https://example.com/cover.jpg' }),
    __metadata("design:type", String)
], MediaResourceDto.prototype, "coverUrl", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '播放URL', example: 'https://example.com/video.mp4' }),
    __metadata("design:type", String)
], MediaResourceDto.prototype, "playUrl", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '影视时长（秒）', example: 8820 }),
    __metadata("design:type", Number)
], MediaResourceDto.prototype, "duration", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '豆瓣评分', example: 8.7 }),
    __metadata("design:type", Number)
], MediaResourceDto.prototype, "rating", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '豆瓣评分人数', example: 123456 }),
    __metadata("design:type", Number)
], MediaResourceDto.prototype, "ratingCount", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '上映日期', example: '2024-01-01' }),
    __metadata("design:type", Date)
], MediaResourceDto.prototype, "releaseDate", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '是否激活', example: true }),
    __metadata("design:type", Boolean)
], MediaResourceDto.prototype, "isActive", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '创建时间', example: '2024-01-01T00:00:00.000Z' }),
    __metadata("design:type", Date)
], MediaResourceDto.prototype, "createdAt", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '更新时间', example: '2024-01-01T00:00:00.000Z' }),
    __metadata("design:type", Date)
], MediaResourceDto.prototype, "updatedAt", void 0);
class MediaListResponseDto {
    data;
    page;
    pageSize;
    total;
    totalPages;
    hasNext;
    hasPrevious;
}
exports.MediaListResponseDto = MediaListResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: '影视资源列表', type: [MediaResourceDto] }),
    __metadata("design:type", Array)
], MediaListResponseDto.prototype, "data", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '当前页码', example: 1 }),
    __metadata("design:type", Number)
], MediaListResponseDto.prototype, "page", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '每页数量', example: 10 }),
    __metadata("design:type", Number)
], MediaListResponseDto.prototype, "pageSize", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '总记录数', example: 100 }),
    __metadata("design:type", Number)
], MediaListResponseDto.prototype, "total", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '总页数', example: 10 }),
    __metadata("design:type", Number)
], MediaListResponseDto.prototype, "totalPages", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '是否有下一页', example: true }),
    __metadata("design:type", Boolean)
], MediaListResponseDto.prototype, "hasNext", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '是否有上一页', example: false }),
    __metadata("design:type", Boolean)
], MediaListResponseDto.prototype, "hasPrevious", void 0);
class MediaDetailResponseDto {
    data;
    recommendations;
    playSources;
}
exports.MediaDetailResponseDto = MediaDetailResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: '影视资源详情' }),
    __metadata("design:type", MediaResourceDto)
], MediaDetailResponseDto.prototype, "data", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '相关推荐', type: [MediaResourceDto], required: false }),
    __metadata("design:type", Array)
], MediaDetailResponseDto.prototype, "recommendations", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '播放源列表', type: [Object], required: false }),
    __metadata("design:type", Array)
], MediaDetailResponseDto.prototype, "playSources", void 0);
class ErrorResponse {
    statusCode;
    message;
    errors;
    timestamp;
}
exports.ErrorResponse = ErrorResponse;
__decorate([
    (0, swagger_1.ApiProperty)({ description: '错误码', example: 400 }),
    __metadata("design:type", Number)
], ErrorResponse.prototype, "statusCode", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '错误消息', example: '请求参数错误' }),
    __metadata("design:type", String)
], ErrorResponse.prototype, "message", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '错误详情',
        example: ['title is required', 'type must be valid'],
        isArray: true,
        required: false,
    }),
    __metadata("design:type", Array)
], ErrorResponse.prototype, "errors", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '时间戳', example: '2024-01-01T00:00:00.000Z' }),
    __metadata("design:type", String)
], ErrorResponse.prototype, "timestamp", void 0);
//# sourceMappingURL=media-resource-response.dto.js.map