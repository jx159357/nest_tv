import { createConnection } from 'typeorm';
import * as dotenv from 'dotenv';

dotenv.config();

async function checkUserDirectly() {
  try {
    // 创建数据库连接
    const connection = await createConnection({
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

    // 直接执行SQL查询
    const result = await connection.query('SELECT id, username, email, password FROM users WHERE username = ?', ['admin']);
    
    if (result && result.length > 0) {
      const user = result[0];
      console.log('找到用户:');
      console.log(`ID: ${user.id}`);
      console.log(`用户名: ${user.username}`);
      console.log(`邮箱: ${user.email}`);
      console.log(`密码: ${user.password}`);
      console.log(`密码长度: ${user.password?.length || 0}`);
    } else {
      console.log('未找到用户名为 admin 的用户');
    }

    await connection.close();
  } catch (error) {
    console.error('直接查询用户时出错:', error);
  }
}

checkUserDirectly();