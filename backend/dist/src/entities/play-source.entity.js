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
exports.PlaySource = exports.PlaySourceStatus = exports.PlaySourceType = void 0;
const typeorm_1 = require("typeorm");
const user_entity_1 = require("./user.entity");
const media_resource_entity_1 = require("./media-resource.entity");
var PlaySourceType;
(function (PlaySourceType) {
    PlaySourceType["ONLINE"] = "online";
    PlaySourceType["DOWNLOAD"] = "download";
    PlaySourceType["STREAM"] = "stream";
    PlaySourceType["THIRD_PARTY"] = "third_party";
    PlaySourceType["MAGNET"] = "magnet";
    PlaySourceType["IPTV"] = "iptv";
    PlaySourceType["WEBDISK"] = "webdisk";
    PlaySourceType["PARSER"] = "parser";
})(PlaySourceType || (exports.PlaySourceType = PlaySourceType = {}));
var PlaySourceStatus;
(function (PlaySourceStatus) {
    PlaySourceStatus["ACTIVE"] = "active";
    PlaySourceStatus["INACTIVE"] = "inactive";
    PlaySourceStatus["ERROR"] = "error";
    PlaySourceStatus["CHECKING"] = "checking";
})(PlaySourceStatus || (exports.PlaySourceStatus = PlaySourceStatus = {}));
let PlaySource = class PlaySource {
    id;
    url;
    type;
    status;
    resolution;
    format;
    subtitleUrl;
    priority;
    isAds;
    playCount;
    description;
    sourceName;
    name;
    isActive;
    headers;
    expireDate;
    channelGroup;
    channelLogo;
    providerName;
    magnetInfo;
    webDiskInfo;
    episodeNumber;
    createdAt;
    updatedAt;
    lastCheckedAt;
    mediaResource;
    mediaResourceId;
    configuredBy;
};
exports.PlaySource = PlaySource;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], PlaySource.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 500 }),
    __metadata("design:type", String)
], PlaySource.prototype, "url", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'enum', enum: PlaySourceType }),
    __metadata("design:type", String)
], PlaySource.prototype, "type", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'enum', enum: PlaySourceStatus, default: PlaySourceStatus.CHECKING }),
    __metadata("design:type", String)
], PlaySource.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 100, nullable: true }),
    __metadata("design:type", String)
], PlaySource.prototype, "resolution", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 50, nullable: true }),
    __metadata("design:type", String)
], PlaySource.prototype, "format", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], PlaySource.prototype, "subtitleUrl", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: 0 }),
    __metadata("design:type", Number)
], PlaySource.prototype, "priority", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: true }),
    __metadata("design:type", Boolean)
], PlaySource.prototype, "isAds", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: 0 }),
    __metadata("design:type", Number)
], PlaySource.prototype, "playCount", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], PlaySource.prototype, "description", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 100, nullable: true }),
    __metadata("design:type", String)
], PlaySource.prototype, "sourceName", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 200, nullable: true }),
    __metadata("design:type", String)
], PlaySource.prototype, "name", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: true }),
    __metadata("design:type", Boolean)
], PlaySource.prototype, "isActive", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'json', nullable: true }),
    __metadata("design:type", Object)
], PlaySource.prototype, "headers", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'date', nullable: true }),
    __metadata("design:type", Date)
], PlaySource.prototype, "expireDate", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 50, nullable: true }),
    __metadata("design:type", String)
], PlaySource.prototype, "channelGroup", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 20, nullable: true }),
    __metadata("design:type", String)
], PlaySource.prototype, "channelLogo", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 100, nullable: true }),
    __metadata("design:type", String)
], PlaySource.prototype, "providerName", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'json', nullable: true }),
    __metadata("design:type", Object)
], PlaySource.prototype, "magnetInfo", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'json', nullable: true }),
    __metadata("design:type", Object)
], PlaySource.prototype, "webDiskInfo", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", Number)
], PlaySource.prototype, "episodeNumber", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], PlaySource.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], PlaySource.prototype, "updatedAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", Date)
], PlaySource.prototype, "lastCheckedAt", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => media_resource_entity_1.MediaResource, media => media.playSources),
    __metadata("design:type", media_resource_entity_1.MediaResource)
], PlaySource.prototype, "mediaResource", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Number)
], PlaySource.prototype, "mediaResourceId", void 0);
__decorate([
    (0, typeorm_1.ManyToMany)(() => user_entity_1.User, user => user.configuredPlaySources),
    (0, typeorm_1.JoinTable)(),
    __metadata("design:type", Array)
], PlaySource.prototype, "configuredBy", void 0);
exports.PlaySource = PlaySource = __decorate([
    (0, typeorm_1.Entity)('play_sources'),
    (0, typeorm_1.Index)('idx_play_source_type', ['type']),
    (0, typeorm_1.Index)('idx_play_source_status', ['status']),
    (0, typeorm_1.Index)('idx_play_source_type_status', ['type', 'status']),
    (0, typeorm_1.Index)('idx_play_source_priority', ['priority']),
    (0, typeorm_1.Index)('idx_play_source_resolution', ['resolution']),
    (0, typeorm_1.Index)('idx_play_source_priority_status', ['priority', 'status']),
    (0, typeorm_1.Index)('idx_play_source_playcount', ['playCount']),
    (0, typeorm_1.Index)('idx_play_source_playcount_status', ['playCount', 'status']),
    (0, typeorm_1.Index)('idx_play_source_media', ['mediaResourceId']),
    (0, typeorm_1.Index)('idx_play_source_media_type_status', ['mediaResourceId', 'type', 'status']),
    (0, typeorm_1.Index)('idx_play_source_expire', ['expireDate']),
    (0, typeorm_1.Index)('idx_play_source_created', ['createdAt'])
], PlaySource);
//# sourceMappingURL=play-source.entity.js.map