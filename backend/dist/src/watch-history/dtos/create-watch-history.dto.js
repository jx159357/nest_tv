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
exports.CreateWatchHistoryDto = void 0;
const class_validator_1 = require("class-validator");
const swagger_1 = require("@nestjs/swagger");
class CreateWatchHistoryDto {
    userId;
    mediaResourceId;
    currentTime = 0;
    duration;
    episodeNumber;
    isCompleted = false;
    device;
    quality;
    note;
}
exports.CreateWatchHistoryDto = CreateWatchHistoryDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: '用户ID' }),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", Number)
], CreateWatchHistoryDto.prototype, "userId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '影视资源ID' }),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", Number)
], CreateWatchHistoryDto.prototype, "mediaResourceId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '当前观看时间（秒）', default: 0 }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], CreateWatchHistoryDto.prototype, "currentTime", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '总时长（秒）', required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], CreateWatchHistoryDto.prototype, "duration", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '当前播放的剧集号', required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], CreateWatchHistoryDto.prototype, "episodeNumber", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '是否已看完', default: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], CreateWatchHistoryDto.prototype, "isCompleted", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '播放设备', required: false }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateWatchHistoryDto.prototype, "device", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '播放质量', required: false }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateWatchHistoryDto.prototype, "quality", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '备注', required: false }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateWatchHistoryDto.prototype, "note", void 0);
//# sourceMappingURL=create-watch-history.dto.js.map