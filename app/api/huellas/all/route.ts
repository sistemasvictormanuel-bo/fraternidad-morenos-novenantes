// app/api/huellas/all/route.ts
import { NextResponse } from 'next/server';
import mysql from 'mysql2/promise';
import { dbConfig } from '@/lib/db-config'

export async function POST() {  // ✅ CAMBIÉ GET POR POST
  try {
    const connection = await mysql.createConnection({
      host: dbConfig.host,
      user: dbConfig.user,
      password: dbConfig.password,
      database: dbConfig.database
    });
    
    const sql = 'SELECT id as fraterno_id, huella_template FROM fraternos WHERE huella_template IS NOT NULL';
    
    const [rows] = await connection.execute(sql);
    await connection.end();

    const huellasBase64 = (rows as any[]).map(row => ({
      fraternoId: row.fraterno_id,
      huella_feature_set: row.huella_template
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
