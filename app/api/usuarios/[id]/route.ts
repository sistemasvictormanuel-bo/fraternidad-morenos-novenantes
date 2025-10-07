// app/api/usuarios/[id]/route.ts
import { NextResponse } from "next/server"
import { query } from "@/lib/db"

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const usuarios = await query(`
      SELECT u.*, f.nombre as fraterno_nombre 
      FROM usuarios u 
      LEFT JOIN fraternos f ON u.fraterno_id = f.id
      WHERE u.id = ?
    `, [params.id])
    
    if (usuarios.length === 0) {
      return NextResponse.json({ 
        success: false, 
        error: "Usuario no encontrado" 
      }, { status: 404 })
    }

    return NextResponse.json({ success: true, data: usuarios[0] })
  } catch (error) {
    return NextResponse.json({ 
      success: false, 
      error: "Error obteniendo usuario" 
    }, { status: 500 })
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { username, password, role, fraterno_id } = await request.json()

    if (!username || !role) {
      return NextResponse.json({ 
        success: false, 
        error: "Usuario y rol son requeridos" 
      }, { status: 400 })
    }

    let updateQuery = `
      UPDATE usuarios SET 
        username = ?, role = ?, fraterno_id = ?, updated_at = CURRENT_TIMESTAMP
    `
    let queryParams: any[] = [username, role, fraterno_id || null]

    // Si hay nueva contraseña, actualizarla
    if (password) {
      const bcrypt = await import('bcryptjs')
      const passwordHash = await bcrypt.hash(password, 10)
      updateQuery += `, password_hash = ?`
      queryParams.push(passwordHash)
    }

    updateQuery += ` WHERE id = ?`
    queryParams.push(params.id)

    await query(updateQuery, queryParams)
    
    return NextResponse.json({ 
      success: true, 
      message: "Usuario actualizado exitosamente" 
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
      error: "Error actualizando usuario" 
    }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // No permitir eliminar el usuario admin principal
    const usuarios = await query('SELECT username FROM usuarios WHERE id = ?', [params.id])
    
    if (usuarios.length > 0 && usuarios[0].username === 'admin') {
      return NextResponse.json({ 
        success: false, 
        error: "No se puede eliminar el usuario admin principal" 
      }, { status: 400 })
    }

    await query('DELETE FROM usuarios WHERE id = ?', [params.id])
    
    return NextResponse.json({ 
      success: true, 
      message: "Usuario eliminado exitosamente" 
    })
  } catch (error) {
    return NextResponse.json({ 
      success: false, 
      error: "Error eliminando usuario" 
    }, { status: 500 })
  }
}