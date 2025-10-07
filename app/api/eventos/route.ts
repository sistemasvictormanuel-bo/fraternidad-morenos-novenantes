import { type NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/db"
import type { EventoFormData } from "@/lib/types"

// GET: Obtener todos los eventos
export async function GET() {
  try {
    const sql = `
    SELECT e.*, te.nombre as tipo_evento_nombre
FROM eventos e
LEFT JOIN tipo_eventos te ON e.tipo_evento_id = te.id
ORDER BY e.fecha DESC

    `

    const eventos = await query<any[]>(sql)

    // Transformar para incluir el objeto tipo_evento
    const eventosFormatted = eventos.map((evento) => ({
      ...evento,
      tipo_evento: evento.tipo_evento_nombre
        ? {
            id: evento.tipo_evento_id,
            nombre: evento.tipo_evento_nombre,
          }
        : null,
    }))

    return NextResponse.json({ success: true, data: eventosFormatted })
  } catch (error) {
    console.error("[v0] Error fetching eventos:", error)
    return NextResponse.json({ success: false, error: "Error al obtener eventos" }, { status: 500 })
  }
}

// POST: Crear nuevo evento
export async function POST(request: NextRequest) {
  try {
    const data: EventoFormData = await request.json()

    const sql = `
      INSERT INTO eventos (nombre, descripcion, fecha, tipo_evento_id)
  VALUES (?, ?, ?, ?)
    `

    const result: any = await query(sql, [
      data.nombre,
      data.descripcion || null,
      data.fecha_evento,
      data.tipo_evento_id,
    ])

    return NextResponse.json({
      success: true,
      data: { id: result.insertId, ...data },
    })
  } catch (error) {
    console.error("[v0] Error creating evento:", error)
    return NextResponse.json({ success: false, error: "Error al crear evento" }, { status: 500 })
  }
}
