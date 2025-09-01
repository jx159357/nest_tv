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
exports.CreateParseProviderDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
class CreateParseProviderDto {
    name;
    baseUrl;
    parseRule;
    apiUrl;
    apiMethod = 'GET';
    apiHeaders;
    description;
    isActive = true;
    successRate = 0;
    requestCount = 0;
    successCount = 0;
    config;
    metadata;
    category;
    supportOnlinePlay = true;
    supportDownload = true;
    priority = 'medium';
    expireDate;
    dailyRequestLimit = 0;
}
exports.CreateParseProviderDto = CreateParseProviderDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: '解析提供商名称' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateParseProviderDto.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '解析站基础URL' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateParseProviderDto.prototype, "baseUrl", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '解析规则（JSON格式）' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateParseProviderDto.prototype, "parseRule", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'API接口URL', required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateParseProviderDto.prototype, "apiUrl", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'API请求方法', required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateParseProviderDto.prototype, "apiMethod", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'API请求头（JSON格式）', required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateParseProviderDto.prototype, "apiHeaders", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '解析提供商描述', required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateParseProviderDto.prototype, "description", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '是否可用', default: true }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], CreateParseProviderDto.prototype, "isActive", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '成功率', default: 0 }),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], CreateParseProviderDto.prototype, "successRate", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '请求次数', default: 0 }),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], CreateParseProviderDto.prototype, "requestCount", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '成功次数', default: 0 }),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], CreateParseProviderDto.prototype, "successCount", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '扩展配置', required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsObject)(),
    __metadata("design:type", Object)
], CreateParseProviderDto.prototype, "config", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '扩展元数据', required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsObject)(),
    __metadata("design:type", Object)
], CreateParseProviderDto.prototype, "metadata", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '解析提供商分类', required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateParseProviderDto.prototype, "category", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '支持在线播放', default: true }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], CreateParseProviderDto.prototype, "supportOnlinePlay", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '支持下载链接', default: true }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], CreateParseProviderDto.prototype, "supportDownload", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '优先级', required: false, enum: ['high', 'medium', 'low'] }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(['high', 'medium', 'low']),
    __metadata("design:type", String)
], CreateParseProviderDto.prototype, "priority", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '过期时间', required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Date),
    __metadata("design:type", Date)
], CreateParseProviderDto.prototype, "expireDate", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '每日请求限制', default: 0 }),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], CreateParseProviderDto.prototype, "dailyRequestLimit", void 0);
//# sourceMappingURL=create-parse-provider.dto.js.map