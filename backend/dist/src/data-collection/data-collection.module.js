"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DataCollectionModule = void 0;
const common_1 = require("@nestjs/common");
const data_collection_controller_1 = require("./data-collection.controller");
const data_collection_service_1 = require("./data-collection.service");
const app_logger_service_1 = require("../common/services/app-logger.service");
let DataCollectionModule = class DataCollectionModule {
};
exports.DataCollectionModule = DataCollectionModule;
exports.DataCollectionModule = DataCollectionModule = __decorate([
    (0, common_1.Module)({
        controllers: [data_collection_controller_1.DataCollectionController],
        providers: [data_collection_service_1.DataCollectionService, app_logger_service_1.AppLoggerService],
        exports: [data_collection_service_1.DataCollectionService],
    })
], DataCollectionModule);
//# sourceMappingURL=data-collection.module.js.map