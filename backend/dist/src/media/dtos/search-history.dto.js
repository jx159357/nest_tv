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
exports.SearchHistoryQueryDto = exports.UpdateSearchHistoryDto = exports.CreateSearchHistoryDto = void 0;
const class_validator_1 = require("class-validator");
const swagger_1 = require("@nestjs/swagger");
class CreateSearchHistoryDto {
    keyword;
    resultCount;
    searchTime;
    filters;
}
exports.CreateSearchHistoryDto = CreateSearchHistoryDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: '搜索关键词' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateSearchHistoryDto.prototype, "keyword", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '搜索结果数量', required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], CreateSearchHistoryDto.prototype, "resultCount", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '搜索耗时（秒）', required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], CreateSearchHistoryDto.prototype, "searchTime", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '搜索过滤器', required: false }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Object)
], CreateSearchHistoryDto.prototype, "filters", void 0);
class UpdateSearchHistoryDto {
    keyword;
    resultCount;
    searchTime;
    isActive;
    filters;
}
exports.UpdateSearchHistoryDto = UpdateSearchHistoryDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: '搜索关键词', required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateSearchHistoryDto.prototype, "keyword", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '搜索结果数量', required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], UpdateSearchHistoryDto.prototype, "resultCount", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '搜索耗时（秒）', required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], UpdateSearchHistoryDto.prototype, "searchTime", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '是否活跃', required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], UpdateSearchHistoryDto.prototype, "isActive", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '搜索过滤器', required: false }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Object)
], UpdateSearchHistoryDto.prototype, "filters", void 0);
class SearchHistoryQueryDto {
    page = 1;
    pageSize = 10;
    onlyActive = true;
    keyword;
    startDate;
    endDate;
}
exports.SearchHistoryQueryDto = SearchHistoryQueryDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: '页码', required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], SearchHistoryQueryDto.prototype, "page", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '每页数量', required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(1),
    (0, class_validator_1.Max)(100),
    __metadata("design:type", Number)
], SearchHistoryQueryDto.prototype, "pageSize", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '是否只包含活跃记录', required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], SearchHistoryQueryDto.prototype, "onlyActive", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '关键词过滤', required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], SearchHistoryQueryDto.prototype, "keyword", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '开始日期', required: false }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Date)
], SearchHistoryQueryDto.prototype, "startDate", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '结束日期', required: false }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Date)
], SearchHistoryQueryDto.prototype, "endDate", void 0);
//# sourceMappingURL=search-history.dto.js.map