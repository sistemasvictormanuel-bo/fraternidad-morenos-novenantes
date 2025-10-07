import { type NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/db"
import type { Fraterno, FraternoFormData } from "@/lib/types"

// GET: Obtener todos los fraternos
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const bloqueId = searchParams.get("bloque_id")
    const estado = searchParams.get("estado")
    const search = searchParams.get("search")

    let sql = `
      SELECT f.*, b.nombre_bloque, b.tipobloque
      FROM fraternos f
      LEFT JOIN bloques b ON f.bloque_id = b.id
      WHERE 1=1
    `
    const params: any[] = []

    if (bloqueId) {
      sql += " AND f.bloque_id = ?"
      params.push(bloqueId)
    }

    if (estado) {
      sql += " AND f.estado = ?"
      params.push(estado)
    }

    if (search) {
      sql += " AND (f.nombre LIKE ? OR f.ci LIKE ? OR f.celular LIKE ?)"
      const searchTerm = `%${search}%`
      params.push(searchTerm, searchTerm, searchTerm)
    }

    sql += " ORDER BY f.nombre ASC"

    const fraternos = await query<Fraterno[]>(sql, params)

    return NextResponse.json({ success: true, data: fraternos })
  } catch (error) {
    console.error("[v0] Error fetching fraternos:", error)
    return NextResponse.json({ success: false, error: "Error al obtener fraternos" }, { status: 500 })
  }
}

// POST: Crear nuevo fraterno
export async function POST(request: NextRequest) {
  try {
    const data: FraternoFormData = await request.json()

    const sql = `
      INSERT INTO fraternos (
        ci, fechanacimiento, nombre, celular, foto, genero, bloque_id,
        talla_blusa, talla_zapato, talla_mantilla, tela_traje, tela_pollera,
        corse, monto_tela_traje, monto_tela_pollera, monto_corse, estado,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
    `

    const params = [
      data.ci,
      data.fechanacimiento,
      data.nombre,
      data.celular,
      data.foto || null,
      data.genero,
      data.bloque_id || null,
      data.talla_blusa || null,
      data.talla_zapato || null,
      data.talla_mantilla || null,
      data.tela_traje || null,
      data.tela_pollera || null,
      data.corse || null,
      data.monto_tela_traje || null,
      data.monto_tela_pollera || null,
      data.monto_corse || null,
      data.estado,
    ]

    const result: any = await query(sql, params)

    return NextResponse.json({
      success: true,
      data: { id: result.insertId, ...data },
    })
  } catch (error) {
    console.error("[v0] Error creating fraterno:", error)
    return NextResponse.json({ success: false, error: "Error al crear fraterno" }, { status: 500 })
  }
}
