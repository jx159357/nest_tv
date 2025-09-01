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
exports.AdminPermission = void 0;
const typeorm_1 = require("typeorm");
const admin_role_entity_1 = require("./admin-role.entity");
let AdminPermission = class AdminPermission {
    id;
    code;
    name;
    description;
    resource;
    action;
    isActive;
    createdAt;
    updatedAt;
    roles;
};
exports.AdminPermission = AdminPermission;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], AdminPermission.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ unique: true }),
    __metadata("design:type", String)
], AdminPermission.prototype, "code", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], AdminPermission.prototype, "name", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], AdminPermission.prototype, "description", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], AdminPermission.prototype, "resource", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], AdminPermission.prototype, "action", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: true }),
    __metadata("design:type", Boolean)
], AdminPermission.prototype, "isActive", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], AdminPermission.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], AdminPermission.prototype, "updatedAt", void 0);
__decorate([
    (0, typeorm_1.ManyToMany)(() => admin_role_entity_1.AdminRole, role => role.permissions),
    __metadata("design:type", Array)
], AdminPermission.prototype, "roles", void 0);
exports.AdminPermission = AdminPermission = __decorate([
    (0, typeorm_1.Entity)('admin_permissions')
], AdminPermission);
//# sourceMappingURL=admin-permission.entity.js.map