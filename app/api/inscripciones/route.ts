import { type NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/db"

// GET: Obtener todas las inscripciones
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const eventoId = searchParams.get("evento_id")

    let sql = `
      SELECT 
        i.*,
        f.nombre as fraterno_nombre,
        f.ci as fraterno_ci,
        f.celular as fraterno_celular,
        b.nombre_bloque,
        e.nombre as evento_nombre,
        e.fecha
      FROM inscripciones i
      INNER JOIN fraternos f ON i.fraterno_id = f.id
      LEFT JOIN bloques b ON f.bloque_id = b.id
      INNER JOIN eventos e ON i.evento_id = e.id
      WHERE 1=1
    `
    const params: any[] = []

    if (eventoId) {
      sql += " AND i.evento_id = ?"
      params.push(eventoId)
    }

    sql += " ORDER BY i.fecha_inscripcion DESC"

    const inscripciones = await query<any[]>(sql, params)

    // Formatear datos para incluir objetos anidados
    const inscripcionesFormatted = inscripciones.map((inscripcion) => ({
      id: inscripcion.id,
      fraterno_id: inscripcion.fraterno_id,
      evento_id: inscripcion.evento_id,
      fecha_inscripcion: inscripcion.fecha_inscripcion,
      created_at: inscripcion.created_at,
      updated_at: inscripcion.updated_at,
      fraterno: {
        id: inscripcion.fraterno_id,
        nombre: inscripcion.fraterno_nombre,
        ci: inscripcion.fraterno_ci,
        celular: inscripcion.fraterno_celular,
        bloque: inscripcion.nombre_bloque
          ? {
              nombre_bloque: inscripcion.nombre_bloque,
            }
          : null,
      },
      evento: {
        id: inscripcion.evento_id,
        nombre: inscripcion.evento_nombre,
        fecha_evento: inscripcion.fecha_evento,
      },
    }))

    return NextResponse.json({ success: true, data: inscripcionesFormatted })
  } catch (error) {
    console.error("[v0] Error fetching inscripciones:", error)
    return NextResponse.json({ success: false, error: "Error al obtener inscripciones" }, { status: 500 })
  }
}

// POST: Crear nueva inscripción
export async function POST(request: NextRequest) {
  try {
    const { fraterno_id, evento_id } = await request.json()

    // Verificar si ya existe la inscripción
    const existing = await query<any[]>("SELECT id FROM inscripciones WHERE fraterno_id = ? AND evento_id = ?", [
      fraterno_id,
      evento_id,
    ])

    if (existing.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error: "El fraterno ya está inscrito en este evento",
        },
        { status: 400 },
      )
    }

    const sql = `
      INSERT INTO inscripciones (fraterno_id, evento_id, fecha_inscripcion, created_at, updated_at)
      VALUES (?, ?, NOW(), NOW(), NOW())
    `

    const result: any = await query(sql, [fraterno_id, evento_id])

    return NextResponse.json({
      success: true,
      data: { id: result.insertId, fraterno_id, evento_id },
    })
  } catch (error) {
    console.error("[v0] Error creating inscripcion:", error)
    return NextResponse.json({ success: false, error: "Error al crear inscripción" }, { status: 500 })
  }
}
