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
exports.MediaResource = exports.MediaQuality = exports.MediaType = void 0;
const typeorm_1 = require("typeorm");
const user_entity_1 = require("./user.entity");
const watch_history_entity_1 = require("./watch-history.entity");
const play_source_entity_1 = require("./play-source.entity");
const recommendation_entity_1 = require("./recommendation.entity");
var MediaType;
(function (MediaType) {
    MediaType["MOVIE"] = "movie";
    MediaType["TV_SERIES"] = "tv_series";
    MediaType["VARIETY"] = "variety";
    MediaType["ANIME"] = "anime";
    MediaType["DOCUMENTARY"] = "documentary";
})(MediaType || (exports.MediaType = MediaType = {}));
var MediaQuality;
(function (MediaQuality) {
    MediaQuality["HD"] = "hd";
    MediaQuality["FULL_HD"] = "full_hd";
    MediaQuality["BLUE_RAY"] = "blue_ray";
    MediaQuality["SD"] = "sd";
})(MediaQuality || (exports.MediaQuality = MediaQuality = {}));
let MediaResource = class MediaResource {
    id;
    title;
    description;
    type;
    director;
    actors;
    genres;
    releaseDate;
    quality;
    poster;
    backdrop;
    rating;
    viewCount;
    isActive;
    source;
    metadata;
    episodeCount;
    downloadUrls;
    createdAt;
    updatedAt;
    favorites;
    watchHistory;
    playSources;
    recommendations;
};
exports.MediaResource = MediaResource;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], MediaResource.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 200 }),
    __metadata("design:type", String)
], MediaResource.prototype, "title", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], MediaResource.prototype, "description", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'enum', enum: MediaType }),
    __metadata("design:type", String)
], MediaResource.prototype, "type", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 100, nullable: true }),
    __metadata("design:type", String)
], MediaResource.prototype, "director", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], MediaResource.prototype, "actors", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'simple-array', nullable: true }),
    __metadata("design:type", Array)
], MediaResource.prototype, "genres", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'date', nullable: true }),
    __metadata("design:type", Date)
], MediaResource.prototype, "releaseDate", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'enum', enum: MediaQuality, default: MediaQuality.HD }),
    __metadata("design:type", String)
], MediaResource.prototype, "quality", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 500, nullable: true }),
    __metadata("design:type", String)
], MediaResource.prototype, "poster", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 500, nullable: true }),
    __metadata("design:type", String)
], MediaResource.prototype, "backdrop", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: 0 }),
    __metadata("design:type", Number)
], MediaResource.prototype, "rating", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: 0 }),
    __metadata("design:type", Number)
], MediaResource.prototype, "viewCount", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: true }),
    __metadata("design:type", Boolean)
], MediaResource.prototype, "isActive", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 50, nullable: true }),
    __metadata("design:type", String)
], MediaResource.prototype, "source", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'json', nullable: true }),
    __metadata("design:type", Object)
], MediaResource.prototype, "metadata", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", Number)
], MediaResource.prototype, "episodeCount", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'simple-array', nullable: true }),
    __metadata("design:type", Array)
], MediaResource.prototype, "downloadUrls", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], MediaResource.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], MediaResource.prototype, "updatedAt", void 0);
__decorate([
    (0, typeorm_1.ManyToMany)(() => user_entity_1.User, user => user.favorites),
    (0, typeorm_1.JoinTable)(),
    __metadata("design:type", Array)
], MediaResource.prototype, "favorites", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => watch_history_entity_1.WatchHistory, history => history.mediaResource),
    __metadata("design:type", Array)
], MediaResource.prototype, "watchHistory", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => play_source_entity_1.PlaySource, playSource => playSource.mediaResource),
    __metadata("design:type", Array)
], MediaResource.prototype, "playSources", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => recommendation_entity_1.Recommendation, recommendation => recommendation.mediaResource),
    __metadata("design:type", Array)
], MediaResource.prototype, "recommendations", void 0);
exports.MediaResource = MediaResource = __decorate([
    (0, typeorm_1.Entity)('media_resources')
], MediaResource);
//# sourceMappingURL=media-resource.entity.js.map