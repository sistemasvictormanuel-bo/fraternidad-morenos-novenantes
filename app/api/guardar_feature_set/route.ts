// app/api/guardar_feature_set/route.ts
import { NextResponse } from 'next/server';
import mysql from 'mysql2/promise';
import { dbConfig } from '@/lib/db-config'

export async function POST(request: Request) {
  try {
    const { fraterno_id, feature_set_base64 } = await request.json();

    if (!fraterno_id || !feature_set_base64) {
      return NextResponse.json(
        { success: false, message: 'Faltan fraterno_id o feature_set_base64' },
        { status: 400 }
      );
    }

    /*const connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '',
      database: 'db_hr_management'
    });*/
    const connection = await mysql.createConnection({
      host: dbConfig.host,
      user: dbConfig.user,
      password: dbConfig.password,
      database: dbConfig.database
    });


    // ✅ CAMBIO CLAVE: Usar "huella_template" que es tu campo real
    const sql = `
    UPDATE fraternos 
    SET huella_template = ? 
    WHERE id = ?
  `;

  const [result] = await connection.execute(sql, [feature_set_base64, fraterno_id]);
    await connection.end();

    return NextResponse.json({
      success: true,
      message: 'Feature Set guardado exitosamente',
      id: (result as any).insertId || fraterno_id
    });

  } catch (error) {
    console.error('Error guardando Feature Set:', error);
    return NextResponse.json(
      { success: false, message: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}