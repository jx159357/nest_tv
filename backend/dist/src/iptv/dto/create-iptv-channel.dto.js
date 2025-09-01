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
exports.CreateIPTVChannelDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
class CreateIPTVChannelDto {
    name;
    url;
    group;
    logo;
    epgId;
    language;
    country;
    region;
    description;
    resolution;
    isActive = true;
    viewCount = 0;
    metadata;
    expireDate;
    isLive = true;
    streamFormat;
    backupUrls;
}
exports.CreateIPTVChannelDto = CreateIPTVChannelDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: '频道名称' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateIPTVChannelDto.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '频道流媒体URL' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateIPTVChannelDto.prototype, "url", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '频道分组' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateIPTVChannelDto.prototype, "group", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '频道Logo URL', required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateIPTVChannelDto.prototype, "logo", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '电子节目单ID', required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateIPTVChannelDto.prototype, "epgId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '语言', required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateIPTVChannelDto.prototype, "language", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '国家', required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateIPTVChannelDto.prototype, "country", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '地区', required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateIPTVChannelDto.prototype, "region", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '频道描述', required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateIPTVChannelDto.prototype, "description", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '分辨率', required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateIPTVChannelDto.prototype, "resolution", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '是否可用', default: true }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], CreateIPTVChannelDto.prototype, "isActive", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '观看次数', default: 0 }),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], CreateIPTVChannelDto.prototype, "viewCount", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '扩展元数据', required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsObject)(),
    __metadata("design:type", Object)
], CreateIPTVChannelDto.prototype, "metadata", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '过期时间', required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Date),
    __metadata("design:type", Date)
], CreateIPTVChannelDto.prototype, "expireDate", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '是否为直播', default: true }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], CreateIPTVChannelDto.prototype, "isLive", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '流媒体格式', required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateIPTVChannelDto.prototype, "streamFormat", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '备用URL列表', required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsString)({ each: true }),
    __metadata("design:type", Array)
], CreateIPTVChannelDto.prototype, "backupUrls", void 0);
//# sourceMappingURL=create-iptv-channel.dto.js.map