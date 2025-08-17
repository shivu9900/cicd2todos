import mysql from "mysql2/promise";

const isSocket = process.env.DB_HOST && process.env.DB_HOST.startsWith('/cloudsql/');
const pool = mysql.createPool({
  ...(isSocket
    ? { socketPath: process.env.DB_HOST }
    : { host: process.env.DB_HOST }),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

export default pool;
