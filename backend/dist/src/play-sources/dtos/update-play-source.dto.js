"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdatePlaySourceDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const create_play_source_dto_1 = require("./create-play-source.dto");
class UpdatePlaySourceDto extends (0, swagger_1.PartialType)(create_play_source_dto_1.CreatePlaySourceDto) {
}
exports.UpdatePlaySourceDto = UpdatePlaySourceDto;
//# sourceMappingURL=update-play-source.dto.js.map