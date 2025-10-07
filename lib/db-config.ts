/*export const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'db_hr_management',
    port: process.env.DB_PORT ? parseInt(process.env.DB_PORT) : 3306,
  }*/

    // lib/db-config.ts
// lib/db-config.ts
export const dbConfig = {
  host: process.env.DB_HOST,           // ← Toma de .env.local o Vercel
  user: process.env.DB_USER,           // ← Toma de .env.local o Vercel  
  password: process.env.DB_PASSWORD,   // ← Toma de .env.local o Vercel
  database: process.env.DB_NAME,       // ← Toma de .env.local o Vercel
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
}