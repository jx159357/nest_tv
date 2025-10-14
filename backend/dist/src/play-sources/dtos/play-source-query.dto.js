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
exports.PlaySourceQueryDto = void 0;
const class_validator_1 = require("class-validator");
const swagger_1 = require("@nestjs/swagger");
const play_source_entity_1 = require("../../entities/play-source.entity");
class PlaySourceQueryDto {
    page = 1;
    pageSize = 10;
    mediaResourceId;
    type;
    resolution;
    isActive;
    search;
}
exports.PlaySourceQueryDto = PlaySourceQueryDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '页码',
        example: 1,
        required: false,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)({}, { message: '页码必须是数字' }),
    (0, class_validator_1.Min)(1, { message: '页码不能小于1' }),
    __metadata("design:type", Number)
], PlaySourceQueryDto.prototype, "page", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '每页数量',
        example: 10,
        required: false,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)({}, { message: '每页数量必须是数字' }),
    (0, class_validator_1.Min)(1, { message: '每页数量不能小于1' }),
    (0, class_validator_1.Max)(100, { message: '每页数量不能超过100' }),
    __metadata("design:type", Number)
], PlaySourceQueryDto.prototype, "pageSize", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '媒体资源ID',
        example: 1,
        required: false,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)({}, { message: '媒体资源ID必须是数字' }),
    __metadata("design:type", Number)
], PlaySourceQueryDto.prototype, "mediaResourceId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '播放源类型',
        enum: play_source_entity_1.PlaySourceType,
        required: false,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(play_source_entity_1.PlaySourceType, { message: '播放源类型无效' }),
    __metadata("design:type", String)
], PlaySourceQueryDto.prototype, "type", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '分辨率/质量',
        example: '1080p',
        required: false,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)({ message: '分辨率必须是字符串' }),
    __metadata("design:type", String)
], PlaySourceQueryDto.prototype, "resolution", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '是否启用',
        example: true,
        required: false,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)({ message: '启用状态必须是布尔值' }),
    __metadata("design:type", Boolean)
], PlaySourceQueryDto.prototype, "isActive", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '搜索关键词',
        example: 'example',
        required: false,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)({ message: '搜索关键词必须是字符串' }),
    __metadata("design:type", String)
], PlaySourceQueryDto.prototype, "search", void 0);
//# sourceMappingURL=play-source-query.dto.js.map