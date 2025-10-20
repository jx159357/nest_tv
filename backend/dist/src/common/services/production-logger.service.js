"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProductionLoggerService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
let ProductionLoggerService = class ProductionLoggerService {
    configService;
    logger;
    logDirectory;
    maxLogSize;
    maxLogFiles;
    logToFile;
    constructor(configService) {
        this.configService = configService;
        this.logger = new common_1.Logger('ProductionLogger');
        this.logToFile = this.configService.get('LOG_TO_FILE', false);
        this.logDirectory = this.configService.get('LOG_FILE_PATH', './logs');
        this.maxLogSize = this.parseSize(this.configService.get('LOG_MAX_SIZE', '10MB'));
        this.maxLogFiles = parseInt(this.configService.get('LOG_MAX_FILES', '5'));
        if (this.logToFile) {
            this.ensureLogDirectory();
        }
    }
    parseSize(sizeStr) {
        const units = {
            'B': 1,
            'KB': 1024,
            'MB': 1024 * 1024,
            'GB': 1024 * 1024 * 1024,
        };
        const match = sizeStr.match(/^(\d+)(B|KB|MB|GB)$/i);
        if (!match) {
            return 10 * 1024 * 1024;
        }
        const [, size, unit] = match;
        return parseInt(size) * (units[unit.toUpperCase()] || 1024 * 1024);
    }
    ensureLogDirectory() {
        if (!fs.existsSync(this.logDirectory)) {
            fs.mkdirSync(this.logDirectory, { recursive: true });
        }
    }
    getLogFilePath(type) {
        const date = new Date().toISOString().split('T')[0];
        return path.join(this.logDirectory, `${type}-${date}.log`);
    }
    rotateLogFile(filePath) {
        if (!fs.existsSync(filePath)) {
            return;
        }
        const stats = fs.statSync(filePath);
        if (stats.size < this.maxLogSize) {
            return;
        }
        for (let i = this.maxLogFiles - 1; i > 0; i--) {
            const oldFile = `${filePath}.${i}`;
            const newFile = `${filePath}.${i + 1}`;
            if (fs.existsSync(oldFile)) {
                if (i === this.maxLogFiles - 1) {
                    fs.unlinkSync(oldFile);
                }
                else {
                    fs.renameSync(oldFile, newFile);
                }
            }
        }
        fs.renameSync(filePath, `${filePath}.1`);
    }
    writeToFile(level, message, context, timestamp) {
        if (!this.logToFile) {
            return;
        }
        const filePath = this.getLogFilePath(level.toLowerCase());
        this.rotateLogFile(filePath);
        const logEntry = {
            timestamp: timestamp || new Date().toISOString(),
            level,
            message,
            context,
            pid: process.pid,
        };
        const logLine = JSON.stringify(logEntry) + '\n';
        fs.appendFileSync(filePath, logLine, 'utf8');
    }
    log(message, context) {
        this.logger.log(message, context);
        this.writeToFile('INFO', message, context);
    }
    error(message, context, trace) {
        this.logger.error(message, trace, context);
        this.writeToFile('ERROR', message, context);
        if (trace) {
            this.writeToFile('ERROR', trace, context);
        }
    }
    warn(message, context) {
        this.logger.warn(message, context);
        this.writeToFile('WARN', message, context);
    }
    debug(message, context) {
        if (process.env.NODE_ENV === 'development') {
            this.logger.debug(message, context);
            this.writeToFile('DEBUG', message, context);
        }
    }
    logAccess(method, url, statusCode, responseTime, userId) {
        const accessLog = {
            method,
            url,
            statusCode,
            responseTime,
            userId,
            userAgent: 'user-agent',
            ip: 'client-ip',
        };
        this.writeToFile('ACCESS', JSON.stringify(accessLog), 'HTTP_ACCESS');
    }
    logPerformance(operation, duration, metadata) {
        const perfLog = {
            operation,
            duration,
            metadata,
            timestamp: new Date().toISOString(),
        };
        this.writeToFile('PERF', JSON.stringify(perfLog), 'PERFORMANCE');
    }
    logSecurity(event, details, severity = 'MEDIUM') {
        const securityLog = {
            event,
            severity,
            details,
            timestamp: new Date().toISOString(),
            ip: details.ip || 'unknown',
            userAgent: details.userAgent || 'unknown',
        };
        this.writeToFile('SECURITY', JSON.stringify(securityLog), 'SECURITY_EVENT');
        if (severity === 'HIGH' || severity === 'CRITICAL') {
            this.error(`安全事件: ${event}`, 'SECURITY', JSON.stringify(details));
        }
    }
    cleanupOldLogs() {
        if (!this.logToFile) {
            return;
        }
        try {
            const files = fs.readdirSync(this.logDirectory);
            const now = Date.now();
            const maxAge = 30 * 24 * 60 * 60 * 1000;
            files.forEach(file => {
                const filePath = path.join(this.logDirectory, file);
                const stats = fs.statSync(filePath);
                if (now - stats.mtime.getTime() > maxAge) {
                    fs.unlinkSync(filePath);
                    this.log(`删除过期日志文件: ${file}`, 'CLEANUP');
                }
            });
        }
        catch (error) {
            this.error('清理过期日志文件失败', 'CLEANUP', error instanceof Error ? error.stack : undefined);
        }
    }
};
exports.ProductionLoggerService = ProductionLoggerService;
exports.ProductionLoggerService = ProductionLoggerService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], ProductionLoggerService);
//# sourceMappingURL=production-logger.service.js.map