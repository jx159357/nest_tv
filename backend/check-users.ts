import { createConnection } from 'typeorm';
import { User } from './src/entities/user.entity';
import * as dotenv from 'dotenv';

dotenv.config();

async function checkUsers() {
  try {
    // 创建数据库连接
    const connection = await createConnection({
      type: 'mysql',
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '3306'),
      username: process.env.DB_USERNAME || 'root',
      password: process.env.DB_PASSWORD || 'jx159357',
      database: process.env.DB_DATABASE || 'nest_tv',
      entities: [User],
      synchronize: false,
      logging: false,
    });

    console.log('数据库连接成功');

    // 查询所有用户
    const users = await connection.getRepository(User).find();
    
    console.log('用户列表:');
    users.forEach(user => {
      console.log(`ID: ${user.id}`);
      console.log(`用户名: ${user.username}`);
      console.log(`邮箱: ${user.email}`);
      console.log(`密码: ${user.password}`);
      console.log(`密码长度: ${user.password?.length || 0}`);
      console.log('---');
    });

    await connection.close();
  } catch (error) {
    console.error('检查用户时出错:', error);
  }
}

checkUsers();