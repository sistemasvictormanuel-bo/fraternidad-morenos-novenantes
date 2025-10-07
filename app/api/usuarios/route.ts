// app/api/usuarios/route.ts
import { NextResponse } from "next/server"
import { query } from "@/lib/db"

export async function GET() {
  try {
    const usuarios = await query(`
      SELECT u.*, f.nombre as fraterno_nombre 
      FROM usuarios u 
      LEFT JOIN fraternos f ON u.fraterno_id = f.id
      ORDER BY u.created_at DESC
    `)
    
    return NextResponse.json({ success: true, data: usuarios })
  } catch (error) {
    return NextResponse.json({ 
      success: false, 
      error: "Error obteniendo usuarios" 
    }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const { username, password, role, fraterno_id } = await request.json()

    if (!username || !password) {
      return NextResponse.json({ 
        success: false, 
        error: "Usuario y contraseña son requeridos" 
      }, { status: 400 })
    }

    const bcrypt = await import('bcryptjs')
    const passwordHash = await bcrypt.hash(password, 10)
    
    await query(
      `INSERT INTO usuarios (username, password_hash, role, fraterno_id) 
       VALUES (?, ?, ?, ?)`,
      [username, passwordHash, role, fraterno_id || null]
    )
    
    return NextResponse.json({ 
      success: true, 
      message: "Usuario creado exitosamente" 
    })
  } catch (error: any) {
    if (error.code === 'ER_DUP_ENTRY') {
      return NextResponse.json({ 
        success: false, 
        error: "El usuario ya existe" 
      }, { status: 400 })
    }
    
    return NextResponse.json({ 
      success: false, 
      error: "Error creando usuario" 
    }, { status: 500 })
  }
}