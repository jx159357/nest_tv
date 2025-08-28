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
exports.CreatePlaySourceDto = void 0;
const class_validator_1 = require("class-validator");
const play_source_entity_1 = require("../../entities/play-source.entity");
const swagger_1 = require("@nestjs/swagger");
class CreatePlaySourceDto {
    url;
    type;
    status = play_source_entity_1.PlaySourceStatus.CHECKING;
    resolution;
    format;
    subtitleUrl;
    priority = 0;
    isAds = true;
    description;
    sourceName;
    headers;
    expireDate;
    episodeNumber;
    mediaResourceId;
}
exports.CreatePlaySourceDto = CreatePlaySourceDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: '播放链接' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.IsUrl)(),
    __metadata("design:type", String)
], CreatePlaySourceDto.prototype, "url", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '播放源类型', enum: play_source_entity_1.PlaySourceType }),
    (0, class_validator_1.IsEnum)(play_source_entity_1.PlaySourceType),
    __metadata("design:type", String)
], CreatePlaySourceDto.prototype, "type", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '播放源状态', enum: play_source_entity_1.PlaySourceStatus, default: play_source_entity_1.PlaySourceStatus.CHECKING }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(play_source_entity_1.PlaySourceStatus),
    __metadata("design:type", String)
], CreatePlaySourceDto.prototype, "status", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '分辨率', required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreatePlaySourceDto.prototype, "resolution", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '视频格式', required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreatePlaySourceDto.prototype, "format", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '字幕链接', required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUrl)(),
    __metadata("design:type", String)
], CreatePlaySourceDto.prototype, "subtitleUrl", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '优先级', default: 0 }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], CreatePlaySourceDto.prototype, "priority", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '是否有广告', default: true }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], CreatePlaySourceDto.prototype, "isAds", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '描述信息', required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreatePlaySourceDto.prototype, "description", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '来源名称', required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreatePlaySourceDto.prototype, "sourceName", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '请求头信息', required: false }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Object)
], CreatePlaySourceDto.prototype, "headers", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '过期时间', required: false }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Date)
], CreatePlaySourceDto.prototype, "expireDate", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '剧集号', required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], CreatePlaySourceDto.prototype, "episodeNumber", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '关联的影视资源ID' }),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", Number)
], CreatePlaySourceDto.prototype, "mediaResourceId", void 0);
//# sourceMappingURL=create-play-source.dto.js.map