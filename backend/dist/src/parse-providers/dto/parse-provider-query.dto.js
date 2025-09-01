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
exports.ParseProviderQueryDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
class ParseProviderQueryDto {
    page = 1;
    limit = 10;
    category;
    priority;
    activeOnly = true;
    supportOnlinePlay;
    supportDownload;
    minSuccessRate;
    sortBy = 'createdAt';
    sortOrder = 'DESC';
    search;
}
exports.ParseProviderQueryDto = ParseProviderQueryDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: '页码', default: 1 }),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], ParseProviderQueryDto.prototype, "page", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '每页数量', default: 10 }),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], ParseProviderQueryDto.prototype, "limit", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '解析提供商分类', required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ParseProviderQueryDto.prototype, "category", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '优先级', required: false, enum: ['high', 'medium', 'low'] }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(['high', 'medium', 'low']),
    __metadata("design:type", String)
], ParseProviderQueryDto.prototype, "priority", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '是否可用', default: true }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], ParseProviderQueryDto.prototype, "activeOnly", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '支持在线播放', required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], ParseProviderQueryDto.prototype, "supportOnlinePlay", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '支持下载链接', required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], ParseProviderQueryDto.prototype, "supportDownload", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '最小成功率', required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], ParseProviderQueryDto.prototype, "minSuccessRate", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '排序字段', default: 'createdAt' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ParseProviderQueryDto.prototype, "sortBy", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '排序方式', default: 'DESC', enum: ['ASC', 'DESC'] }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(['ASC', 'DESC']),
    __metadata("design:type", String)
], ParseProviderQueryDto.prototype, "sortOrder", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '搜索关键词', required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ParseProviderQueryDto.prototype, "search", void 0);
//# sourceMappingURL=parse-provider-query.dto.js.map