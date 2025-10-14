"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.InitializationModule = void 0;
const common_1 = require("@nestjs/common");
const initialization_service_1 = require("./initialization.service");
const media_module_1 = require("../media/media.module");
const play_source_module_1 = require("../play-sources/play-source.module");
let InitializationModule = class InitializationModule {
};
exports.InitializationModule = InitializationModule;
exports.InitializationModule = InitializationModule = __decorate([
    (0, common_1.Module)({
        imports: [media_module_1.MediaResourceModule, play_source_module_1.PlaySourceModule],
        providers: [initialization_service_1.InitializationService],
        exports: [initialization_service_1.InitializationService],
    })
], InitializationModule);
//# sourceMappingURL=initialization.module.js.map