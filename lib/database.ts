import mysql from 'mysql2/promise';

const dbConfig = {
  host: process.env.MYSQL_HOST,
  port: parseInt(process.env.MYSQL_PORT || '3306'),
  user: process.env.MYSQL_USER,
  password: process.env.MYSQL_PASSWORD,
  database: process.env.MYSQL_DATABASE,
  ssl: {
    rejectUnauthorized: false
  },
  connectTimeout: 60000,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
};

let pool: mysql.Pool | null = null;

export async function getConnection() {
  if (!pool) {
    try {
      pool = mysql.createPool(dbConfig);
      console.log('Pool de conexões MySQL criado');
    } catch (error) {
      console.error('Erro ao criar pool MySQL:', error);
      throw error;
    }
  }
  return pool;
}

export async function executeQuery(query: string, params: any[] = []) {
  try {
    const poolConnection = await getConnection();
    const [results] = await poolConnection.execute(query, params);
    return results;
  } catch (error) {
    console.error('Erro ao executar query:', error);
    throw error;
  }
}

export async function closeConnection() {
  if (pool) {
    await pool.end();
    pool = null;
    console.log('Pool de conexões MySQL fechado');
  }
}