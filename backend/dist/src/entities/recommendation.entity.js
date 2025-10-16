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
exports.Recommendation = void 0;
const typeorm_1 = require("typeorm");
const user_entity_1 = require("./user.entity");
const media_resource_entity_1 = require("./media-resource.entity");
let Recommendation = class Recommendation {
    id;
    type;
    userId;
    mediaResourceId;
    score;
    priority;
    isActive;
    metadata;
    expiresAt;
    createdAt;
    updatedAt;
    user;
    mediaResource;
};
exports.Recommendation = Recommendation;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], Recommendation.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: [
            'collaborative',
            'content',
            'trending',
            'editorial',
            'personalized',
            'latest',
            'top-rated',
        ],
        default: 'personalized',
    }),
    (0, typeorm_1.Index)(),
    __metadata("design:type", String)
], Recommendation.prototype, "type", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int' }),
    (0, typeorm_1.Index)(),
    __metadata("design:type", Number)
], Recommendation.prototype, "userId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int' }),
    (0, typeorm_1.Index)(),
    __metadata("design:type", Number)
], Recommendation.prototype, "mediaResourceId", void 0);
__decorate([
    (0, typeorm_1.Index)(['userId', 'isActive', 'type']),
    (0, typeorm_1.Index)(['userId', 'isActive', 'priority']),
    (0, typeorm_1.Index)(['type', 'isActive', 'score']),
    (0, typeorm_1.Index)(['expiresAt', 'isActive']),
    (0, typeorm_1.Index)(['mediaResourceId', 'userId']),
    (0, typeorm_1.Column)({ type: 'decimal', precision: 5, scale: 2, default: 0 }),
    __metadata("design:type", Number)
], Recommendation.prototype, "score", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'smallint', default: 1 }),
    (0, typeorm_1.Index)(),
    __metadata("design:type", Number)
], Recommendation.prototype, "priority", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'boolean', default: true }),
    (0, typeorm_1.Index)(),
    __metadata("design:type", Boolean)
], Recommendation.prototype, "isActive", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'json', nullable: true }),
    __metadata("design:type", Object)
], Recommendation.prototype, "metadata", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamp', nullable: true }),
    (0, typeorm_1.Index)(),
    __metadata("design:type", Date)
], Recommendation.prototype, "expiresAt", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    (0, typeorm_1.Index)(),
    __metadata("design:type", Date)
], Recommendation.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], Recommendation.prototype, "updatedAt", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User, user => user.recommendations, { onDelete: 'CASCADE' }),
    __metadata("design:type", user_entity_1.User)
], Recommendation.prototype, "user", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => media_resource_entity_1.MediaResource, media => media.recommendations, { onDelete: 'CASCADE' }),
    __metadata("design:type", media_resource_entity_1.MediaResource)
], Recommendation.prototype, "mediaResource", void 0);
exports.Recommendation = Recommendation = __decorate([
    (0, typeorm_1.Entity)('recommendations')
], Recommendation);
//# sourceMappingURL=recommendation.entity.js.map