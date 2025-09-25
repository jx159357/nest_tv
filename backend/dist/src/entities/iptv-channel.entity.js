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
exports.IPTVChannel = void 0;
const typeorm_1 = require("typeorm");
const media_resource_entity_1 = require("./media-resource.entity");
let IPTVChannel = class IPTVChannel {
    id;
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
    isActive;
    viewCount;
    metadata;
    expireDate;
    createdAt;
    updatedAt;
    lastCheckedAt;
    isLive;
    streamFormat;
    backupUrls;
    mediaResources;
    getPrimaryStreamUrl() {
        return this.url;
    }
    getAllStreamUrls() {
        const urls = [this.url];
        if (this.backupUrls && this.backupUrls.length > 0) {
            urls.push(...this.backupUrls);
        }
        return urls;
    }
    isAvailable() {
        return this.isActive && this.url.length > 0;
    }
    getChannelInfo() {
        return {
            id: this.id,
            name: this.name,
            group: this.group,
            logo: this.logo,
            resolution: this.resolution,
            language: this.language,
            country: this.country,
            description: this.description,
            isLive: this.isLive,
            streamFormat: this.streamFormat,
            viewCount: this.viewCount,
            urls: this.getAllStreamUrls(),
            metadata: this.metadata,
        };
    }
};
exports.IPTVChannel = IPTVChannel;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], IPTVChannel.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 200 }),
    __metadata("design:type", String)
], IPTVChannel.prototype, "name", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 500 }),
    __metadata("design:type", String)
], IPTVChannel.prototype, "url", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 50 }),
    __metadata("design:type", String)
], IPTVChannel.prototype, "group", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 20, nullable: true }),
    __metadata("design:type", String)
], IPTVChannel.prototype, "logo", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 100, nullable: true }),
    __metadata("design:type", String)
], IPTVChannel.prototype, "epgId", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 50, nullable: true }),
    __metadata("design:type", String)
], IPTVChannel.prototype, "language", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 50, nullable: true }),
    __metadata("design:type", String)
], IPTVChannel.prototype, "country", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 50, nullable: true }),
    __metadata("design:type", String)
], IPTVChannel.prototype, "region", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], IPTVChannel.prototype, "description", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 20, nullable: true }),
    __metadata("design:type", String)
], IPTVChannel.prototype, "resolution", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: true }),
    __metadata("design:type", Boolean)
], IPTVChannel.prototype, "isActive", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: 0 }),
    __metadata("design:type", Number)
], IPTVChannel.prototype, "viewCount", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'json', nullable: true }),
    __metadata("design:type", Object)
], IPTVChannel.prototype, "metadata", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'date', nullable: true }),
    __metadata("design:type", Date)
], IPTVChannel.prototype, "expireDate", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], IPTVChannel.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], IPTVChannel.prototype, "updatedAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", Date)
], IPTVChannel.prototype, "lastCheckedAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: true }),
    __metadata("design:type", Boolean)
], IPTVChannel.prototype, "isLive", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 20, nullable: true }),
    __metadata("design:type", String)
], IPTVChannel.prototype, "streamFormat", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'json', nullable: true }),
    __metadata("design:type", Array)
], IPTVChannel.prototype, "backupUrls", void 0);
__decorate([
    (0, typeorm_1.ManyToMany)(() => media_resource_entity_1.MediaResource, media => media.iptvChannels),
    (0, typeorm_1.JoinTable)(),
    __metadata("design:type", Array)
], IPTVChannel.prototype, "mediaResources", void 0);
exports.IPTVChannel = IPTVChannel = __decorate([
    (0, typeorm_1.Entity)('iptv_channels')
], IPTVChannel);
//# sourceMappingURL=iptv-channel.entity.js.map