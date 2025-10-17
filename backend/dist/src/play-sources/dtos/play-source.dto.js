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
exports.UpdatePlaySourceDto = exports.CreatePlaySourceDto = void 0;
const class_validator_1 = require("class-validator");
const swagger_1 = require("@nestjs/swagger");
const play_source_entity_1 = require("../../entities/play-source.entity");
class CreatePlaySourceDto {
    mediaResourceId;
    type;
    name;
    url;
    resolution;
    language;
    subtitle;
    priority;
    isActive;
}
exports.CreatePlaySourceDto = CreatePlaySourceDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '关联的媒体资源ID',
        example: 1,
    }),
    (0, class_validator_1.IsNumber)({}, { message: '媒体资源ID必须是数字' }),
    __metadata("design:type", Number)
], CreatePlaySourceDto.prototype, "mediaResourceId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '播放源类型',
        enum: play_source_entity_1.PlaySourceType,
        example: play_source_entity_1.PlaySourceType.ONLINE,
    }),
    (0, class_validator_1.IsEnum)(play_source_entity_1.PlaySourceType, { message: '播放源类型无效' }),
    __metadata("design:type", String)
], CreatePlaySourceDto.prototype, "type", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '播放源名称',
        example: '高清在线播放',
    }),
    (0, class_validator_1.IsString)({ message: '播放源名称必须是字符串' }),
    __metadata("design:type", String)
], CreatePlaySourceDto.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '播放URL',
        example: 'https://streaming-platform.com/videos/movie1.mp4',
    }),
    (0, class_validator_1.IsUrl)({}, { message: '播放URL格式无效' }),
    __metadata("design:type", String)
], CreatePlaySourceDto.prototype, "url", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '分辨率',
        example: '1080p',
        required: false,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)({ message: '分辨率必须是字符串' }),
    __metadata("design:type", String)
], CreatePlaySourceDto.prototype, "resolution", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '语言',
        example: '中文',
        required: false,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)({ message: '语言必须是字符串' }),
    __metadata("design:type", String)
], CreatePlaySourceDto.prototype, "language", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '字幕URL',
        example: 'https://streaming-platform.com/subtitles/movie1.srt',
        required: false,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUrl)({}, { message: '字幕URL格式无效' }),
    __metadata("design:type", String)
], CreatePlaySourceDto.prototype, "subtitle", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '优先级',
        example: 1,
        required: false,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)({}, { message: '优先级必须是数字' }),
    (0, class_validator_1.Min)(1, { message: '优先级不能小于1' }),
    __metadata("design:type", Number)
], CreatePlaySourceDto.prototype, "priority", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '是否启用',
        example: true,
        required: false,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)({ message: '启用状态必须是布尔值' }),
    __metadata("design:type", Boolean)
], CreatePlaySourceDto.prototype, "isActive", void 0);
class UpdatePlaySourceDto {
    name;
    url;
    resolution;
    language;
    subtitle;
    priority;
    isActive;
}
exports.UpdatePlaySourceDto = UpdatePlaySourceDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '播放源名称',
        example: '高清在线播放',
        required: false,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)({ message: '播放源名称必须是字符串' }),
    __metadata("design:type", String)
], UpdatePlaySourceDto.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '播放URL',
        example: 'https://streaming-platform.com/videos/movie1.mp4',
        required: false,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUrl)({}, { message: '播放URL格式无效' }),
    __metadata("design:type", String)
], UpdatePlaySourceDto.prototype, "url", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '分辨率',
        example: '1080p',
        required: false,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)({ message: '分辨率必须是字符串' }),
    __metadata("design:type", String)
], UpdatePlaySourceDto.prototype, "resolution", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '语言',
        example: '中文',
        required: false,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)({ message: '语言必须是字符串' }),
    __metadata("design:type", String)
], UpdatePlaySourceDto.prototype, "language", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '字幕URL',
        example: 'https://streaming-platform.com/subtitles/movie1.srt',
        required: false,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUrl)({}, { message: '字幕URL格式无效' }),
    __metadata("design:type", String)
], UpdatePlaySourceDto.prototype, "subtitle", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '优先级',
        example: 1,
        required: false,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)({}, { message: '优先级必须是数字' }),
    (0, class_validator_1.Min)(1, { message: '优先级不能小于1' }),
    __metadata("design:type", Number)
], UpdatePlaySourceDto.prototype, "priority", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '是否启用',
        example: true,
        required: false,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)({ message: '启用状态必须是布尔值' }),
    __metadata("design:type", Boolean)
], UpdatePlaySourceDto.prototype, "isActive", void 0);
//# sourceMappingURL=play-source.dto.js.map