// app/api/huellas/all/route.ts
import { NextResponse } from 'next/server';
import mysql from 'mysql2/promise';
import { dbConfig } from '@/lib/db-config'

export async function GET() {
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

    // 🔥 AGREGAR ESTOS HEADERS PARA EVITAR CACHE
    return NextResponse.json(huellasBase64, {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
        'CDN-Cache-Control': 'no-cache',
        'Vercel-CDN-Cache-Control': 'no-cache'
      }
    });

  } catch (error) {
    console.error('Error obteniendo huellas:', error);
    return NextResponse.json(
      { success: false, message: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
