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
exports.AdminLog = void 0;
const typeorm_1 = require("typeorm");
const admin_role_entity_1 = require("./admin-role.entity");
const user_entity_1 = require("./user.entity");
let AdminLog = class AdminLog {
    id;
    action;
    resource;
    metadata;
    description;
    status;
    errorMessage;
    requestInfo;
    role;
    roleId;
    user;
    userId;
    createdAt;
};
exports.AdminLog = AdminLog;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], AdminLog.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text' }),
    __metadata("design:type", String)
], AdminLog.prototype, "action", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text' }),
    __metadata("design:type", String)
], AdminLog.prototype, "resource", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'json', nullable: true }),
    __metadata("design:type", Object)
], AdminLog.prototype, "metadata", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], AdminLog.prototype, "description", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: 'success' }),
    __metadata("design:type", String)
], AdminLog.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], AdminLog.prototype, "errorMessage", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'json', nullable: true }),
    __metadata("design:type", Object)
], AdminLog.prototype, "requestInfo", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => admin_role_entity_1.AdminRole, role => role.adminLogs),
    (0, typeorm_1.JoinColumn)(),
    __metadata("design:type", admin_role_entity_1.AdminRole)
], AdminLog.prototype, "role", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Number)
], AdminLog.prototype, "roleId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User, { nullable: true }),
    (0, typeorm_1.JoinColumn)(),
    __metadata("design:type", user_entity_1.User)
], AdminLog.prototype, "user", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", Number)
], AdminLog.prototype, "userId", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], AdminLog.prototype, "createdAt", void 0);
exports.AdminLog = AdminLog = __decorate([
    (0, typeorm_1.Entity)('admin_logs')
], AdminLog);
//# sourceMappingURL=admin-log.entity.js.map