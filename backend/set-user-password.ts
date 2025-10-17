import { createConnection } from 'typeorm';
import { User } from './src/entities/user.entity';
import * as dotenv from 'dotenv';
import * as bcrypt from 'bcrypt';

dotenv.config();

async function setUserPassword() {
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
      console.log(`当前密码: ${user.password}`);
      
      // 设置新密码（生产环境需要安全处理）
      console.log('生产环境不能设置硬编码密码，请通过应用接口进行密码重置');
      return;
    } else {
      console.log('未找到用户名为 admin 的用户');
    }

    await connection.close();
  } catch (error) {
    console.error('设置用户密码时出错:', error);
  }
}

setUserPassword();