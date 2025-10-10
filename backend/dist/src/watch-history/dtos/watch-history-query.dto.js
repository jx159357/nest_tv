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
exports.WatchHistoryQueryDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
class WatchHistoryQueryDto {
    page = 1;
    limit = 10;
    userId;
    mediaResourceId;
    isCompleted;
    sortBy = 'updatedAt';
    sortOrder = 'DESC';
}
exports.WatchHistoryQueryDto = WatchHistoryQueryDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: '页码', default: 1 }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], WatchHistoryQueryDto.prototype, "page", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '每页数量', default: 10 }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(1),
    (0, class_validator_1.Max)(100),
    __metadata("design:type", Number)
], WatchHistoryQueryDto.prototype, "limit", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '用户ID', required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], WatchHistoryQueryDto.prototype, "userId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '影视资源ID', required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], WatchHistoryQueryDto.prototype, "mediaResourceId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '是否已看完', required: false }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Boolean)
], WatchHistoryQueryDto.prototype, "isCompleted", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '排序字段', default: 'updatedAt' }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], WatchHistoryQueryDto.prototype, "sortBy", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '排序方式', enum: ['ASC', 'DESC'], default: 'DESC' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(['ASC', 'DESC']),
    __metadata("design:type", String)
], WatchHistoryQueryDto.prototype, "sortOrder", void 0);
//# sourceMappingURL=watch-history-query.dto.js.map