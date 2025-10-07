import { type NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/db"
import type { EventoFormData } from "@/lib/types"

// PUT: Actualizar evento
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const data: EventoFormData = await request.json()

    const sql = `
     UPDATE eventos SET
    nombre = ?, 
    descripcion = ?, 
    fecha = ?,             
    tipo_evento_id = ?      
  WHERE id = ?
    `

    await query(sql, [data.nombre, data.descripcion || null, data.fecha_evento, data.tipo_evento_id, params.id])

    return NextResponse.json({
      success: true,
      data: { id: Number.parseInt(params.id), ...data },
    })
  } catch (error) {
    console.error("[v0] Error updating evento:", error)
    return NextResponse.json({ success: false, error: "Error al actualizar evento" }, { status: 500 })
  }
}

// DELETE: Eliminar evento
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    await query("DELETE FROM eventos WHERE id = ?", [params.id])
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Error deleting evento:", error)
    return NextResponse.json({ success: false, error: "Error al eliminar evento" }, { status: 500 })
  }
}
