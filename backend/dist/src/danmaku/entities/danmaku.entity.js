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
exports.Danmaku = void 0;
const typeorm_1 = require("typeorm");
const user_entity_1 = require("../../entities/user.entity");
const media_resource_entity_1 = require("../../entities/media-resource.entity");
let Danmaku = class Danmaku {
    id;
    danmakuId;
    text;
    videoId;
    mediaResourceId;
    color;
    type;
    priority;
    isHighlighted;
    isActive;
    metadata;
    filters;
    createdAt;
    updatedAt;
    userId;
    user;
    mediaResource;
};
exports.Danmaku = Danmaku;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], Danmaku.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 255, name: 'danmaku_id' }),
    __metadata("design:type", String)
], Danmaku.prototype, "danmakuId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text' }),
    __metadata("design:type", String)
], Danmaku.prototype, "text", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 255, name: 'video_id' }),
    __metadata("design:type", String)
], Danmaku.prototype, "videoId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', name: 'media_resource_id' }),
    __metadata("design:type", Number)
], Danmaku.prototype, "mediaResourceId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 7, default: '#FFFFFF' }),
    __metadata("design:type", String)
], Danmaku.prototype, "color", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 20, default: 'scroll' }),
    __metadata("design:type", String)
], Danmaku.prototype, "type", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', default: 1 }),
    __metadata("design:type", Number)
], Danmaku.prototype, "priority", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'boolean', default: false }),
    __metadata("design:type", Boolean)
], Danmaku.prototype, "isHighlighted", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'boolean', default: true }),
    __metadata("design:type", Boolean)
], Danmaku.prototype, "isActive", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'json', nullable: true }),
    __metadata("design:type", Object)
], Danmaku.prototype, "metadata", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'json', nullable: true }),
    __metadata("design:type", Object)
], Danmaku.prototype, "filters", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamp', name: 'created_at', default: () => 'CURRENT_TIMESTAMP' }),
    __metadata("design:type", Date)
], Danmaku.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'timestamp',
        name: 'updated_at',
        default: () => 'CURRENT_TIMESTAMP',
        onUpdate: 'CURRENT_TIMESTAMP',
    }),
    __metadata("design:type", Date)
], Danmaku.prototype, "updatedAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', name: 'user_id' }),
    __metadata("design:type", Number)
], Danmaku.prototype, "userId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User, { onDelete: 'SET NULL' }),
    __metadata("design:type", user_entity_1.User)
], Danmaku.prototype, "user", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => media_resource_entity_1.MediaResource, { onDelete: 'CASCADE' }),
    __metadata("design:type", media_resource_entity_1.MediaResource)
], Danmaku.prototype, "mediaResource", void 0);
exports.Danmaku = Danmaku = __decorate([
    (0, typeorm_1.Entity)('danmaku')
], Danmaku);
//# sourceMappingURL=danmaku.entity.js.map