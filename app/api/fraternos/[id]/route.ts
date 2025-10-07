import { type NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/db"
import type { Fraterno, FraternoFormData } from "@/lib/types"

// GET: Obtener un fraterno por ID
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const sql = `
      SELECT f.*, b.nombre_bloque, b.tipobloque
      FROM fraternos f
      LEFT JOIN bloques b ON f.bloque_id = b.id
      WHERE f.id = ?
    `

    const fraternos = await query<Fraterno[]>(sql, [params.id])

    if (fraternos.length === 0) {
      return NextResponse.json({ success: false, error: "Fraterno no encontrado" }, { status: 404 })
    }

    return NextResponse.json({ success: true, data: fraternos[0] })
  } catch (error) {
    console.error("[v0] Error fetching fraterno:", error)
    return NextResponse.json({ success: false, error: "Error al obtener fraterno" }, { status: 500 })
  }
}

// PUT: Actualizar fraterno
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const data: FraternoFormData = await request.json()

    const sql = `
      UPDATE fraternos SET
        ci = ?, fechanacimiento = ?, nombre = ?, celular = ?, foto = ?,
        genero = ?, bloque_id = ?, talla_blusa = ?, talla_zapato = ?,
        talla_mantilla = ?, tela_traje = ?, tela_pollera = ?, corse = ?,
        monto_tela_traje = ?, monto_tela_pollera = ?, monto_corse = ?,
        estado = ?, updated_at = NOW()
      WHERE id = ?
    `

    const queryParams = [
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
      params.id,
    ]

    await query(sql, queryParams)

    return NextResponse.json({
      success: true,
      data: { id: Number.parseInt(params.id), ...data },
    })
  } catch (error) {
    console.error("[v0] Error updating fraterno:", error)
    return NextResponse.json({ success: false, error: "Error al actualizar fraterno" }, { status: 500 })
  }
}

// DELETE: Eliminar fraterno
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    await query("DELETE FROM fraternos WHERE id = ?", [params.id])

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Error deleting fraterno:", error)
    return NextResponse.json({ success: false, error: "Error al eliminar fraterno" }, { status: 500 })
  }
}
