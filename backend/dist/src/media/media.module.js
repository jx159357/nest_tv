"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MediaResourceModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const media_resource_service_1 = require("./media-resource.service");
const media_resource_controller_1 = require("./media-resource.controller");
const advanced_search_service_1 = require("./advanced-search.service");
const advanced_search_controller_1 = require("./advanced-search.controller");
const media_resource_entity_1 = require("../entities/media-resource.entity");
const play_source_entity_1 = require("../entities/play-source.entity");
const watch_history_entity_1 = require("../entities/watch-history.entity");
const search_history_entity_1 = require("../entities/search-history.entity");
const common_module_1 = require("../common/common.module");
let MediaResourceModule = class MediaResourceModule {
};
exports.MediaResourceModule = MediaResourceModule;
exports.MediaResourceModule = MediaResourceModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([media_resource_entity_1.MediaResource, play_source_entity_1.PlaySource, watch_history_entity_1.WatchHistory, search_history_entity_1.SearchHistory]),
            common_module_1.CommonModule,
        ],
        controllers: [media_resource_controller_1.MediaResourceController, advanced_search_controller_1.AdvancedSearchController],
        providers: [media_resource_service_1.MediaResourceService, advanced_search_service_1.AdvancedSearchService],
        exports: [media_resource_service_1.MediaResourceService, advanced_search_service_1.AdvancedSearchService],
    })
], MediaResourceModule);
//# sourceMappingURL=media.module.js.map