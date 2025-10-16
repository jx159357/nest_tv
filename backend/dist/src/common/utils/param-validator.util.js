"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseQueryNumber = parseQueryNumber;
exports.parseQueryBoolean = parseQueryBoolean;
exports.parseQueryEnum = parseQueryEnum;
exports.parseQueryDate = parseQueryDate;
const common_1 = require("@nestjs/common");
function parseQueryNumber(value, defaultValue, paramName = 'parameter', min, max) {
    if (!value) {
        return defaultValue;
    }
    const parsedValue = parseInt(value, 10);
    if (isNaN(parsedValue)) {
        throw new common_1.BadRequestException(`Invalid ${paramName}: must be a valid number`);
    }
    if (min !== undefined && parsedValue < min) {
        throw new common_1.BadRequestException(`${paramName} must be at least ${min}`);
    }
    if (max !== undefined && parsedValue > max) {
        throw new common_1.BadRequestException(`${paramName} must be at most ${max}`);
    }
    return parsedValue;
}
function parseQueryBoolean(value, defaultValue) {
    if (!value) {
        return defaultValue;
    }
    const normalizedValue = value.toLowerCase();
    if (normalizedValue === 'true' || normalizedValue === '1') {
        return true;
    }
    if (normalizedValue === 'false' || normalizedValue === '0') {
        return false;
    }
    throw new common_1.BadRequestException('Invalid boolean value: must be true, false, 1, or 0');
}
function parseQueryEnum(value, enumValues, defaultValue, paramName = 'parameter') {
    if (!value) {
        return defaultValue;
    }
    const normalizedValue = value.toLowerCase();
    if (enumValues.includes(normalizedValue)) {
        return normalizedValue;
    }
    throw new common_1.BadRequestException(`Invalid ${paramName}: must be one of ${enumValues.join(', ')}`);
}
function parseQueryDate(value, paramName = 'date') {
    if (!value) {
        return undefined;
    }
    const parsedDate = new Date(value);
    if (isNaN(parsedDate.getTime())) {
        throw new common_1.BadRequestException(`Invalid ${paramName}: must be a valid date`);
    }
    return parsedDate;
}
//# sourceMappingURL=param-validator.util.js.map