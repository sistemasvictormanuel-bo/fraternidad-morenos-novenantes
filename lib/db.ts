// Configuración de conexión a MySQL
// Este archivo está preparado para conectarse a tu base de datos MySQL existente

import mysql from "mysql2/promise"

// Configuración de la conexión
const dbConfig = {
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "db_hr_management",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
}

// Pool de conexiones para mejor rendimiento
let pool: mysql.Pool | null = null

export function getPool() {
  if (!pool) {
    pool = mysql.createPool(dbConfig)
  }
  return pool
}

// Función helper para ejecutar queries
export async function query<T = any>(sql: string, params?: any[]): Promise<T> {
  const connection = await getPool().getConnection()
  try {
    const [results] = await connection.execute(sql, params)
    return results as T
  } finally {
    connection.release()
  }
}

// Función helper para transacciones
export async function transaction<T>(callback: (connection: mysql.PoolConnection) => Promise<T>): Promise<T> {
  const connection = await getPool().getConnection()
  try {
    await connection.beginTransaction()
    const result = await callback(connection)
    await connection.commit()
    return result
  } catch (error) {
    await connection.rollback()
    throw error
  } finally {
    connection.release()
  }
}

// Funciones de utilidad para formatear fechas MySQL
export function formatDateForMySQL(date: Date | string): string {
  const d = new Date(date)
  return d.toISOString().slice(0, 19).replace("T", " ")
}

export function parseMySQLDate(dateString: string): Date {
  return new Date(dateString)
}
