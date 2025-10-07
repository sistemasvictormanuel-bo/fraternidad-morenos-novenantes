import { NextResponse } from "next/server"
import { query } from "@/lib/db"

// GET: Obtener todos los tipos de evento
export async function GET() {
  try {
    const tiposEvento = await query<any[]>("SELECT * FROM tipo_eventos ORDER BY nombre ASC")
    return NextResponse.json({ success: true, data: tiposEvento })
  } catch (error) {
    console.error("[v0] Error fetching tipos evento:", error)
    return NextResponse.json({ success: false, error: "Error al obtener tipos de evento" }, { status: 500 })
  }
}
