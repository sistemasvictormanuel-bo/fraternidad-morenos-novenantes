// app/api/huellas/all/route.ts
import { NextResponse } from 'next/server';
import mysql from 'mysql2/promise';
import { dbConfig } from '@/lib/db-config'

export async function GET() {
  try {
  /*  const connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '',
      database: 'db_hr_management'
    });
*/
    const connection = await mysql.createConnection({
      host: dbConfig.host,
      user: dbConfig.user,
      password: dbConfig.password,
      database: dbConfig.database
    });
    // ✅ CAMBIO CLAVE: Usar "huella_template" y mapear a "huella_feature_set" que espera Java
    const sql = 'SELECT id as fraterno_id, huella_template FROM fraternos WHERE huella_template IS NOT NULL';
    
    const [rows] = await connection.execute(sql);
    await connection.end();

    // ✅ Mapear "huella_template" (BD) → "huella_feature_set" (Java)
    const huellasBase64 = (rows as any[]).map(row => ({
      fraternoId: row.fraterno_id,
      huella_feature_set: row.huella_template // Java espera este nombre
    }));

    return NextResponse.json(huellasBase64);

  } catch (error) {
    console.error('Error obteniendo huellas:', error);
    return NextResponse.json(
      { success: false, message: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}