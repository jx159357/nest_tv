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
const dotenv = __importStar(require("dotenv"));
dotenv.config();
async function checkUserDirectly() {
    try {
        const connection = await (0, typeorm_1.createConnection)({
            type: 'mysql',
            host: process.env.DB_HOST || 'localhost',
            port: parseInt(process.env.DB_PORT || '3306'),
            username: process.env.DB_USERNAME || 'root',
            password: process.env.DB_PASSWORD || 'jx159357',
            database: process.env.DB_DATABASE || 'nest_tv',
            synchronize: false,
            logging: false,
        });
        console.log('数据库连接成功');
        const result = await connection.query('SELECT id, username, email, password FROM users WHERE username = ?', ['admin']);
        if (result && result.length > 0) {
            const user = result[0];
            console.log('找到用户:');
            console.log(`ID: ${user.id}`);
            console.log(`用户名: ${user.username}`);
            console.log(`邮箱: ${user.email}`);
            console.log(`密码: ${user.password}`);
            console.log(`密码长度: ${user.password?.length || 0}`);
        }
        else {
            console.log('未找到用户名为 admin 的用户');
        }
        await connection.close();
    }
    catch (error) {
        console.error('直接查询用户时出错:', error);
    }
}
checkUserDirectly();
//# sourceMappingURL=check-user-direct.js.map