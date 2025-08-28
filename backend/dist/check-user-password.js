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
Object.defineProperty(exports, "__esModule", { value: true });
const typeorm_1 = require("typeorm");
const user_entity_1 = require("./src/entities/user.entity");
const dotenv = __importStar(require("dotenv"));
const bcrypt = __importStar(require("bcrypt"));
dotenv.config();
async function checkUserPassword() {
    try {
        const connection = await (0, typeorm_1.createConnection)({
            type: 'mysql',
            host: process.env.DB_HOST || 'localhost',
            port: parseInt(process.env.DB_PORT || '3306'),
            username: process.env.DB_USERNAME || 'root',
            password: process.env.DB_PASSWORD || 'jx159357',
            database: process.env.DB_DATABASE || 'nest_tv',
            entities: [__dirname + '/src/entities/*.entity{.ts,.js}'],
            synchronize: false,
            logging: false,
        });
        console.log('数据库连接成功');
        const userRepository = connection.getRepository(user_entity_1.User);
        const user = await userRepository.findOne({
            where: { username: 'admin' }
        });
        if (user) {
            console.log('找到用户:');
            console.log(`用户名: ${user.username}`);
            console.log(`邮箱: ${user.email}`);
            console.log(`密码: ${user.password}`);
            console.log(`密码长度: ${user.password?.length || 0}`);
            if (user.password) {
                try {
                    const isMatch = await bcrypt.compare('123456789', user.password);
                    console.log(`密码验证结果: ${isMatch}`);
                }
                catch (error) {
                    console.log(`密码验证错误: ${error.message}`);
                }
            }
            else {
                console.log('用户密码为空');
            }
        }
        else {
            console.log('未找到用户名为 admin 的用户');
        }
        await connection.close();
    }
    catch (error) {
        console.error('检查用户密码时出错:', error);
    }
}
checkUserPassword();
//# sourceMappingURL=check-user-password.js.map