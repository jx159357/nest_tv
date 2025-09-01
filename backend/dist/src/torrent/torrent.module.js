"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TorrentModule = void 0;
const common_1 = require("@nestjs/common");
const torrent_controller_1 = require("./torrent.controller");
const torrent_service_1 = require("../common/services/torrent.service");
const app_logger_service_1 = require("../common/services/app-logger.service");
let TorrentModule = class TorrentModule {
};
exports.TorrentModule = TorrentModule;
exports.TorrentModule = TorrentModule = __decorate([
    (0, common_1.Module)({
        controllers: [torrent_controller_1.TorrentController],
        providers: [torrent_service_1.TorrentService, app_logger_service_1.AppLoggerService],
        exports: [torrent_service_1.TorrentService],
    })
], TorrentModule);
//# sourceMappingURL=torrent.module.js.map