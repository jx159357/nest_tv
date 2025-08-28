"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PlaySourceModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const play_source_service_1 = require("./play-source.service");
const play_source_controller_1 = require("./play-source.controller");
const play_source_entity_1 = require("../entities/play-source.entity");
const media_resource_entity_1 = require("../entities/media-resource.entity");
let PlaySourceModule = class PlaySourceModule {
};
exports.PlaySourceModule = PlaySourceModule;
exports.PlaySourceModule = PlaySourceModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([play_source_entity_1.PlaySource, media_resource_entity_1.MediaResource]),
        ],
        controllers: [play_source_controller_1.PlaySourceController],
        providers: [play_source_service_1.PlaySourceService],
        exports: [play_source_service_1.PlaySourceService],
    })
], PlaySourceModule);
//# sourceMappingURL=play-source.module.js.map