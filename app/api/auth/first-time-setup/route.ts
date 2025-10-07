// app/api/auth/first-time-setup/route.ts
import { NextResponse } from "next/server"
import bcrypt from 'bcryptjs'
import { query } from "@/lib/db"

export async function GET() {
  try {
    // Verificar si ya existe algún usuario
    const existingUsers = await query('SELECT COUNT(*) as count FROM usuarios')
    
    if (existingUsers[0].count > 0) {
      return NextResponse.json({
        success: false,
        message: 'Ya existen usuarios en el sistema'
      })
    }

    // Crear usuario admin por defecto - SIN la columna 'nombre'
    const passwordHash = await bcrypt.hash('admin123', 12)
    
    await query(
      `INSERT INTO usuarios (username, password_hash, role) 
       VALUES (?, ?, ?)`,
      ['admin', passwordHash, 'admin']
    )

    return NextResponse.json({
      success: true,
      message: 'Usuario admin creado exitosamente',
      credentials: {
        username: 'admin',
        password: 'admin123',
        role: 'admin'
      }
    })

  } catch (error) {
    console.error('Error en first-time-setup:', error)
    return NextResponse.json({
      success: false,
      message: 'Error creando usuario inicial'
    }, { status: 500 })
  }
}