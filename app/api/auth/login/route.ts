// app/api/auth/login/route.ts
import { NextResponse } from "next/server"
import bcrypt from 'bcryptjs'
import { query } from "@/lib/db"

export async function POST(request: Request) {
  try {
    const { username, password } = await request.json()

    if (!username?.trim() || !password?.trim()) {
      return NextResponse.json({ 
        success: false, 
        error: "Usuario y contraseña son requeridos" 
      }, { status: 400 })
    }

    // Buscar usuario
    const users = await query(
      `SELECT * FROM usuarios WHERE username = ?`,
      [username.trim()]
    )

    if (users.length === 0) {
      return NextResponse.json({ 
        success: false, 
        error: "Usuario no encontrado" 
      }, { status: 401 })
    }

    const user = users[0]

    // Verificar contraseña
    const isValid = await bcrypt.compare(password, user.password_hash)
    
    if (!isValid) {
      return NextResponse.json({ 
        success: false, 
        error: "Contraseña incorrecta" 
      }, { status: 401 })
    }

    // Respuesta exitosa
    const userData = {
      id: user.id,
      username: user.username,
      role: user.role,
      fraterno_id: user.fraterno_id
    }

    const response = NextResponse.json({
      success: true,
      user: userData
    })

    // Cookie mejorada
    response.cookies.set('user', JSON.stringify(userData), {
      maxAge: 60 * 60 * 24, // 24 horas
      path: '/',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax'
    })

    return response

  } catch (error) {
    console.error('Error en login:', error)
    return NextResponse.json({ 
      success: false, 
      error: "Error interno del servidor" 
    }, { status: 500 })
  }
}