"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WatchHistoryModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const watch_history_service_1 = require("./watch-history.service");
const watch_history_controller_1 = require("./watch-history.controller");
const watch_history_entity_1 = require("../entities/watch-history.entity");
const user_entity_1 = require("../entities/user.entity");
const media_resource_entity_1 = require("../entities/media-resource.entity");
let WatchHistoryModule = class WatchHistoryModule {
};
exports.WatchHistoryModule = WatchHistoryModule;
exports.WatchHistoryModule = WatchHistoryModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([watch_history_entity_1.WatchHistory, user_entity_1.User, media_resource_entity_1.MediaResource]),
        ],
        controllers: [watch_history_controller_1.WatchHistoryController],
        providers: [watch_history_service_1.WatchHistoryService],
        exports: [watch_history_service_1.WatchHistoryService],
    })
], WatchHistoryModule);
//# sourceMappingURL=watch-history.module.js.map