"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const admin_service_1 = require("./admin.service");
const admin_controller_1 = require("./admin.controller");
const admin_role_entity_1 = require("../entities/admin-role.entity");
const admin_permission_entity_1 = require("../entities/admin-permission.entity");
const admin_log_entity_1 = require("../entities/admin-log.entity");
const user_entity_1 = require("../entities/user.entity");
const media_resource_entity_1 = require("../entities/media-resource.entity");
const play_source_entity_1 = require("../entities/play-source.entity");
const watch_history_entity_1 = require("../entities/watch-history.entity");
const recommendation_entity_1 = require("../entities/recommendation.entity");
let AdminModule = class AdminModule {
};
exports.AdminModule = AdminModule;
exports.AdminModule = AdminModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([
                admin_role_entity_1.AdminRole,
                admin_permission_entity_1.AdminPermission,
                admin_log_entity_1.AdminLog,
                user_entity_1.User,
                media_resource_entity_1.MediaResource,
                play_source_entity_1.PlaySource,
                watch_history_entity_1.WatchHistory,
                recommendation_entity_1.Recommendation
            ]),
        ],
        controllers: [admin_controller_1.AdminController],
        providers: [admin_service_1.AdminService],
        exports: [admin_service_1.AdminService],
    })
], AdminModule);
//# sourceMappingURL=admin.module.js.map