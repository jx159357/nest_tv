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
exports.WatchHistory = void 0;
const typeorm_1 = require("typeorm");
const user_entity_1 = require("./user.entity");
const media_resource_entity_1 = require("./media-resource.entity");
let WatchHistory = class WatchHistory {
    id;
    progress;
    watchDuration;
    isCompleted;
    episodeNumber;
    playCount;
    lastPlayedAt;
    playSettings;
    notes;
    createdAt;
    updatedAt;
    user;
    userId;
    mediaResource;
    mediaResourceId;
};
exports.WatchHistory = WatchHistory;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], WatchHistory.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'json', nullable: true }),
    __metadata("design:type", Object)
], WatchHistory.prototype, "progress", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: 0 }),
    __metadata("design:type", Number)
], WatchHistory.prototype, "watchDuration", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: false }),
    __metadata("design:type", Boolean)
], WatchHistory.prototype, "isCompleted", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", Number)
], WatchHistory.prototype, "episodeNumber", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: 1 }),
    __metadata("design:type", Number)
], WatchHistory.prototype, "playCount", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", Date)
], WatchHistory.prototype, "lastPlayedAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'json', nullable: true }),
    __metadata("design:type", Object)
], WatchHistory.prototype, "playSettings", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], WatchHistory.prototype, "notes", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], WatchHistory.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], WatchHistory.prototype, "updatedAt", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User, user => user.watchHistory),
    __metadata("design:type", user_entity_1.User)
], WatchHistory.prototype, "user", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Number)
], WatchHistory.prototype, "userId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => media_resource_entity_1.MediaResource, media => media.watchHistory),
    __metadata("design:type", media_resource_entity_1.MediaResource)
], WatchHistory.prototype, "mediaResource", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Number)
], WatchHistory.prototype, "mediaResourceId", void 0);
exports.WatchHistory = WatchHistory = __decorate([
    (0, typeorm_1.Entity)('watch_history')
], WatchHistory);
//# sourceMappingURL=watch-history.entity.js.map