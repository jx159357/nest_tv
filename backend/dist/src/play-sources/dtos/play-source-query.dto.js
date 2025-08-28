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
const swagger_1 = require("@nestjs/swagger");
class PlaySourceQueryDto {
    page = 1;
    limit = 10;
    mediaResourceId;
    type;
    status;
    resolution;
    activeOnly = true;
    sortBy = 'priority';
    sortOrder = 'ASC';
}
exports.PlaySourceQueryDto = PlaySourceQueryDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: '页码', default: 1 }),
    __metadata("design:type", Number)
], PlaySourceQueryDto.prototype, "page", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '每页数量', default: 10 }),
    __metadata("design:type", Number)
], PlaySourceQueryDto.prototype, "limit", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '影视资源ID', required: false }),
    __metadata("design:type", Number)
], PlaySourceQueryDto.prototype, "mediaResourceId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '播放源类型', required: false }),
    __metadata("design:type", String)
], PlaySourceQueryDto.prototype, "type", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '播放源状态', required: false }),
    __metadata("design:type", String)
], PlaySourceQueryDto.prototype, "status", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '分辨率', required: false }),
    __metadata("design:type", String)
], PlaySourceQueryDto.prototype, "resolution", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '是否只显示启用的播放源', default: true }),
    __metadata("design:type", Boolean)
], PlaySourceQueryDto.prototype, "activeOnly", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '排序字段', default: 'priority' }),
    __metadata("design:type", String)
], PlaySourceQueryDto.prototype, "sortBy", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '排序方式', enum: ['ASC', 'DESC'], default: 'ASC' }),
    __metadata("design:type", String)
], PlaySourceQueryDto.prototype, "sortOrder", void 0);
//# sourceMappingURL=play-source-query.dto.js.map