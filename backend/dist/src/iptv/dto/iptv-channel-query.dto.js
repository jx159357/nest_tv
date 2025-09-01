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
exports.IPTVChannelQueryDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
class IPTVChannelQueryDto {
    page = 1;
    limit = 10;
    group;
    language;
    country;
    region;
    resolution;
    streamFormat;
    activeOnly = true;
    isLive;
    sortBy = 'createdAt';
    sortOrder = 'DESC';
    search;
}
exports.IPTVChannelQueryDto = IPTVChannelQueryDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: '页码', default: 1 }),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], IPTVChannelQueryDto.prototype, "page", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '每页数量', default: 10 }),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], IPTVChannelQueryDto.prototype, "limit", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '频道分组', required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], IPTVChannelQueryDto.prototype, "group", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '语言', required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], IPTVChannelQueryDto.prototype, "language", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '国家', required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], IPTVChannelQueryDto.prototype, "country", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '地区', required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], IPTVChannelQueryDto.prototype, "region", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '分辨率', required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], IPTVChannelQueryDto.prototype, "resolution", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '流媒体格式', required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], IPTVChannelQueryDto.prototype, "streamFormat", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '是否可用', default: true }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], IPTVChannelQueryDto.prototype, "activeOnly", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '是否为直播', required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], IPTVChannelQueryDto.prototype, "isLive", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '排序字段', default: 'createdAt' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], IPTVChannelQueryDto.prototype, "sortBy", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '排序方式', default: 'DESC', enum: ['ASC', 'DESC'] }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(['ASC', 'DESC']),
    __metadata("design:type", String)
], IPTVChannelQueryDto.prototype, "sortOrder", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '搜索关键词', required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], IPTVChannelQueryDto.prototype, "search", void 0);
//# sourceMappingURL=iptv-channel-query.dto.js.map