import { type NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/db"
import type { BloqueFormData } from "@/lib/types"

// GET: Obtener todos los bloques
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const tipo = searchParams.get("tipo")

    let sql = `
      SELECT b.*, 
             f.nombre as responsable_nombre,
             COUNT(DISTINCT fm.id) as total_miembros
      FROM bloques b
      LEFT JOIN fraternos f ON b.fraterno_id = f.id
      LEFT JOIN fraternos fm ON fm.bloque_id = b.id
      WHERE 1=1
    `
    const params: any[] = []

    if (tipo) {
      sql += " AND b.tipobloque = ?"
      params.push(tipo)
    }

    sql += " GROUP BY b.id ORDER BY b.nombre_bloque ASC"

    const bloques = await query<any[]>(sql, params)

    return NextResponse.json({ success: true, data: bloques })
  } catch (error) {
    console.error("[v0] Error fetching bloques:", error)
    return NextResponse.json({ success: false, error: "Error al obtener bloques" }, { status: 500 })
  }
}

// POST: Crear nuevo bloque
export async function POST(request: NextRequest) {
  try {
    const data: BloqueFormData = await request.json()

    const sql = `
      INSERT INTO bloques (
        nombre_bloque, estado, fraterno_id, tipobloque, created_at, updated_at
      ) VALUES (?, ?, ?, ?, NOW(), NOW())
    `

    const params = [data.nombre_bloque, data.estado, data.fraterno_id || null, data.tipobloque]

    const result: any = await query(sql, params)

    return NextResponse.json({
      success: true,
      data: { id: result.insertId, ...data },
    })
  } catch (error) {
    console.error("[v0] Error creating bloque:", error)
    return NextResponse.json({ success: false, error: "Error al crear bloque" }, { status: 500 })
  }
}
