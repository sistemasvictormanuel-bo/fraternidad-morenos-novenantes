import { type NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/db"
import type { BloqueFormData } from "@/lib/types"

// GET: Obtener un bloque por ID con sus miembros
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const bloqueSql = `
      SELECT b.*, f.nombre as responsable_nombre
      FROM bloques b
      LEFT JOIN fraternos f ON b.fraterno_id = f.id
      WHERE b.id = ?
    `

    const bloques = await query<any[]>(bloqueSql, [params.id])

    if (bloques.length === 0) {
      return NextResponse.json({ success: false, error: "Bloque no encontrado" }, { status: 404 })
    }

    const miembrosSql = `
      SELECT id, nombre, ci, celular, genero, estado
      FROM fraternos
      WHERE bloque_id = ?
      ORDER BY nombre ASC
    `

    const miembros = await query<any[]>(miembrosSql, [params.id])

    return NextResponse.json({
      success: true,
      data: { ...bloques[0], miembros },
    })
  } catch (error) {
    console.error("[v0] Error fetching bloque:", error)
    return NextResponse.json({ success: false, error: "Error al obtener bloque" }, { status: 500 })
  }
}

// PUT: Actualizar bloque
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const data: BloqueFormData = await request.json()

    const sql = `
      UPDATE bloques SET
        nombre_bloque = ?, estado = ?, fraterno_id = ?, tipobloque = ?,
        updated_at = NOW()
      WHERE id = ?
    `

    await query(sql, [data.nombre_bloque, data.estado, data.fraterno_id || null, data.tipobloque, params.id])

    return NextResponse.json({
      success: true,
      data: { id: Number.parseInt(params.id), ...data },
    })
  } catch (error) {
    console.error("[v0] Error updating bloque:", error)
    return NextResponse.json({ success: false, error: "Error al actualizar bloque" }, { status: 500 })
  }
}

// DELETE: Eliminar bloque
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Verificar si hay fraternos asignados
    const fraternos = await query<any[]>("SELECT COUNT(*) as count FROM fraternos WHERE bloque_id = ?", [params.id])

    if (fraternos[0].count > 0) {
      return NextResponse.json(
        {
          success: false,
          error: "No se puede eliminar un bloque con fraternos asignados",
        },
        { status: 400 },
      )
    }

    await query("DELETE FROM bloques WHERE id = ?", [params.id])

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Error deleting bloque:", error)
    return NextResponse.json({ success: false, error: "Error al eliminar bloque" }, { status: 500 })
  }
}
