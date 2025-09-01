"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RequestIdMiddleware = void 0;
const common_1 = require("@nestjs/common");
let RequestIdMiddleware = class RequestIdMiddleware {
    use(req, res, next) {
        const requestId = this.generateRequestId();
        req.requestId = requestId;
        req.headers['x-request-id'] = requestId;
        req.startTime = Date.now();
        res.setHeader('X-Request-ID', requestId);
        const originalLog = console.log;
        console.log = (...args) => {
            originalLog(`[${requestId}]`, ...args);
        };
        const originalEnd = res.end;
        res.end = function (chunk, encoding) {
            const processingTime = Date.now() - req.startTime;
            console.log(`[${requestId}] Response time: ${processingTime}ms`);
            return originalEnd.call(this, chunk, encoding);
        };
        next();
    }
    generateRequestId() {
        const timestamp = Date.now().toString(36);
        const random = Math.random().toString(36).substr(2, 5);
        const counter = (this.getCounter() % 0xFFFFF).toString(36).padStart(5, '0');
        return `req_${timestamp}_${random}_${counter}`;
    }
    getCounter() {
        const counterKey = 'request_counter';
        const counter = global[counterKey] || 0;
        global[counterKey] = counter + 1;
        return counter;
    }
};
exports.RequestIdMiddleware = RequestIdMiddleware;
exports.RequestIdMiddleware = RequestIdMiddleware = __decorate([
    (0, common_1.Injectable)()
], RequestIdMiddleware);
//# sourceMappingURL=request-id.middleware.js.map