import { createConnection } from 'typeorm';
import { User } from './src/entities/user.entity';
import * as dotenv from 'dotenv';
import * as bcrypt from 'bcrypt';

dotenv.config();

async function checkUserPassword() {
  try {
    // 创建数据库连接
    const connection = await createConnection({
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

    // 查询特定用户
    const userRepository = connection.getRepository(User);
    const user = await userRepository.findOne({
      where: { username: 'admin' }
    });
    
    if (user) {
      console.log('找到用户:');
      console.log(`用户名: ${user.username}`);
      console.log(`邮箱: ${user.email}`);
      console.log(`密码: ${user.password}`);
      console.log(`密码长度: ${user.password?.length || 0}`);
      
      // 测试密码验证
      if (user.password) {
        try {
          // 生产环境密码验证（需要用户输入实际密码）
          console.log('请通过应用接口进行密码验证，脚本已移除硬编码测试密码');
        } catch (error) {
          console.log(`密码验证错误: ${error.message}`);
        }
      } else {
        console.log('用户密码为空');
      }
    } else {
      console.log('未找到用户名为 admin 的用户');
    }

    await connection.close();
  } catch (error) {
    console.error('检查用户密码时出错:', error);
  }
}

checkUserPassword();