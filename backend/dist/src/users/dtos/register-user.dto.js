"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RegisterUserDto = void 0;
const class_validator_1 = require("class-validator");
class RegisterUserDto {
    username;
    password;
    email;
    phone;
    nickname;
}
exports.RegisterUserDto = RegisterUserDto;
__decorate([
    (0, class_validator_1.IsNotEmpty)({ message: '用户名不能为空' }),
    (0, class_validator_1.IsString)({ message: '用户名必须是字符串' }),
    (0, class_validator_1.Length)(3, 20, { message: '用户名长度必须在3-20个字符之间' }),
    __metadata("design:type", String)
], RegisterUserDto.prototype, "username", void 0);
__decorate([
    (0, class_validator_1.IsNotEmpty)({ message: '密码不能为空' }),
    (0, class_validator_1.IsString)({ message: '密码必须是字符串' }),
    (0, class_validator_1.MinLength)(6, { message: '密码长度不能少于6个字符' }),
    __metadata("design:type", String)
], RegisterUserDto.prototype, "password", void 0);
__decorate([
    (0, class_validator_1.IsNotEmpty)({ message: '邮箱不能为空' }),
    (0, class_validator_1.IsEmail)({}, { message: '邮箱格式不正确' }),
    __metadata("design:type", String)
], RegisterUserDto.prototype, "email", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)({ message: '手机号必须是字符串' }),
    (0, class_validator_1.Length)(11, 11, { message: '手机号格式不正确' }),
    __metadata("design:type", String)
], RegisterUserDto.prototype, "phone", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)({ message: '昵称必须是字符串' }),
    (0, class_validator_1.Length)(1, 50, { message: '昵称长度不能超过50个字符' }),
    __metadata("design:type", String)
], RegisterUserDto.prototype, "nickname", void 0);
//# sourceMappingURL=register-user.dto.js.map