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
exports.ParseProvider = void 0;
const typeorm_1 = require("typeorm");
let ParseProvider = class ParseProvider {
    id;
    name;
    baseUrl;
    parseRule;
    apiUrl;
    apiMethod;
    apiHeaders;
    description;
    isActive;
    successRate;
    requestCount;
    successCount;
    config;
    metadata;
    category;
    supportOnlinePlay;
    supportDownload;
    priority;
    expireDate;
    createdAt;
    updatedAt;
    lastUsedAt;
    lastCheckedAt;
    dailyRequestLimit;
    dailyRequestCount;
    dailyResetDate;
    getProviderInfo() {
        return {
            id: this.id,
            name: this.name,
            baseUrl: this.baseUrl,
            apiUrl: this.apiUrl,
            apiMethod: this.apiMethod,
            description: this.description,
            isActive: this.isActive,
            successRate: this.successRate,
            requestCount: this.requestCount,
            successCount: this.successCount,
            category: this.category,
            supportOnlinePlay: this.supportOnlinePlay,
            supportDownload: this.supportDownload,
            priority: this.priority,
            config: this.config,
            metadata: this.metadata,
            dailyRequestLimit: this.dailyRequestLimit,
            dailyRequestCount: this.dailyRequestCount,
        };
    }
    canMakeRequest() {
        if (!this.isActive) {
            return false;
        }
        if (this.dailyRequestLimit > 0) {
            const now = new Date();
            const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            if (!this.dailyResetDate || this.dailyResetDate < today) {
                this.dailyRequestCount = 0;
                this.dailyResetDate = today;
                return true;
            }
            return this.dailyRequestCount < this.dailyRequestLimit;
        }
        return true;
    }
    updateRequestStats(success) {
        this.requestCount++;
        if (success) {
            this.successCount++;
        }
        if (this.requestCount > 0) {
            this.successRate = Math.round((this.successCount / this.requestCount) * 100);
        }
        this.lastUsedAt = new Date();
        if (this.dailyRequestLimit > 0) {
            this.dailyRequestCount++;
        }
    }
    resetDailyCount() {
        this.dailyRequestCount = 0;
        this.dailyResetDate = new Date();
    }
    getParseConfig() {
        try {
            return JSON.parse(this.parseRule);
        }
        catch (error) {
            return null;
        }
    }
    getApiHeaders() {
        try {
            return this.apiHeaders ? JSON.parse(this.apiHeaders) : {};
        }
        catch (error) {
            return {};
        }
    }
    isExpired() {
        if (!this.expireDate) {
            return false;
        }
        return this.expireDate < new Date();
    }
};
exports.ParseProvider = ParseProvider;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], ParseProvider.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 100 }),
    __metadata("design:type", String)
], ParseProvider.prototype, "name", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 500 }),
    __metadata("design:type", String)
], ParseProvider.prototype, "baseUrl", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text' }),
    __metadata("design:type", String)
], ParseProvider.prototype, "parseRule", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 500, nullable: true }),
    __metadata("design:type", String)
], ParseProvider.prototype, "apiUrl", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 100, nullable: true }),
    __metadata("design:type", String)
], ParseProvider.prototype, "apiMethod", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], ParseProvider.prototype, "apiHeaders", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 200, nullable: true }),
    __metadata("design:type", String)
], ParseProvider.prototype, "description", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: true }),
    __metadata("design:type", Boolean)
], ParseProvider.prototype, "isActive", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: 0 }),
    __metadata("design:type", Number)
], ParseProvider.prototype, "successRate", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: 0 }),
    __metadata("design:type", Number)
], ParseProvider.prototype, "requestCount", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: 0 }),
    __metadata("design:type", Number)
], ParseProvider.prototype, "successCount", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'json', nullable: true }),
    __metadata("design:type", Object)
], ParseProvider.prototype, "config", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'json', nullable: true }),
    __metadata("design:type", Object)
], ParseProvider.prototype, "metadata", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 50, nullable: true }),
    __metadata("design:type", String)
], ParseProvider.prototype, "category", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: true }),
    __metadata("design:type", Boolean)
], ParseProvider.prototype, "supportOnlinePlay", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: true }),
    __metadata("design:type", Boolean)
], ParseProvider.prototype, "supportDownload", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 20, nullable: true }),
    __metadata("design:type", String)
], ParseProvider.prototype, "priority", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'date', nullable: true }),
    __metadata("design:type", Date)
], ParseProvider.prototype, "expireDate", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], ParseProvider.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], ParseProvider.prototype, "updatedAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", Date)
], ParseProvider.prototype, "lastUsedAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", Date)
], ParseProvider.prototype, "lastCheckedAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: 0 }),
    __metadata("design:type", Number)
], ParseProvider.prototype, "dailyRequestLimit", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: 0 }),
    __metadata("design:type", Number)
], ParseProvider.prototype, "dailyRequestCount", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'date', nullable: true }),
    __metadata("design:type", Date)
], ParseProvider.prototype, "dailyResetDate", void 0);
exports.ParseProvider = ParseProvider = __decorate([
    (0, typeorm_1.Entity)('parse_providers')
], ParseProvider);
//# sourceMappingURL=parse-provider.entity.js.map