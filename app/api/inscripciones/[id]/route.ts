import { type NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/db"

// DELETE: Eliminar inscripción
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    await query("DELETE FROM inscripciones WHERE id = ?", [params.id])
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Error deleting inscripcion:", error)
    return NextResponse.json({ success: false, error: "Error al eliminar inscripción" }, { status: 500 })
  }
}
