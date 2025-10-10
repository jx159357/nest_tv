"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetCurrentUserId = exports.GetCurrentUser = void 0;
const common_1 = require("@nestjs/common");
exports.GetCurrentUser = (0, common_1.createParamDecorator)((data, ctx) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user;
    if (data) {
        return user[data];
    }
    return user;
});
exports.GetCurrentUserId = (0, common_1.createParamDecorator)((data, ctx) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user;
    if (!user || typeof user.id !== 'number') {
        throw new Error('无法获取用户ID');
    }
    return user.id;
});
//# sourceMappingURL=current-user.decorator.js.map