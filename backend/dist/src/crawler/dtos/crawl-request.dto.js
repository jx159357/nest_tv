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
exports.CrawlAndSaveDto = exports.BatchCrawlRequestDto = exports.CrawlRequestDto = void 0;
const class_validator_1 = require("class-validator");
const crawler_config_1 = require("../crawler.config");
const ALLOWED_TARGETS = crawler_config_1.CRAWLER_TARGETS.map(target => target.name);
class CrawlRequestDto {
    targetName;
    url;
}
exports.CrawlRequestDto = CrawlRequestDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsEnum)(ALLOWED_TARGETS, {
        message: `目标网站必须是: ${ALLOWED_TARGETS.join('、')}`,
    }),
    __metadata("design:type", String)
], CrawlRequestDto.prototype, "targetName", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsUrl)({}, { message: 'URL格式不正确' }),
    __metadata("design:type", String)
], CrawlRequestDto.prototype, "url", void 0);
class BatchCrawlRequestDto {
    targetName;
    urls;
}
exports.BatchCrawlRequestDto = BatchCrawlRequestDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsEnum)(ALLOWED_TARGETS, {
        message: `目标网站必须是: ${ALLOWED_TARGETS.join('、')}`,
    }),
    __metadata("design:type", String)
], BatchCrawlRequestDto.prototype, "targetName", void 0);
__decorate([
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ArrayNotEmpty)({ message: 'URL列表不能为空' }),
    (0, class_validator_1.IsString)({ each: true, message: 'URL列表中的每项都必须是字符串' }),
    __metadata("design:type", Array)
], BatchCrawlRequestDto.prototype, "urls", void 0);
class CrawlAndSaveDto {
    url;
    targetName;
}
exports.CrawlAndSaveDto = CrawlAndSaveDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsUrl)({}, { message: 'URL格式不正确' }),
    __metadata("design:type", String)
], CrawlAndSaveDto.prototype, "url", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(ALLOWED_TARGETS, {
        message: `目标网站必须是: ${ALLOWED_TARGETS.join('、')}`,
    }),
    __metadata("design:type", String)
], CrawlAndSaveDto.prototype, "targetName", void 0);
//# sourceMappingURL=crawl-request.dto.js.map