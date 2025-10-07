import { NextResponse } from "next/server"
import { query } from "@/lib/db"
import type { ReporteEstadisticas } from "@/lib/types"

// GET: Obtener estadísticas del dashboard
export async function GET() {
  try {
    // Total de fraternos
    const totalFraternos = await query<any[]>("SELECT COUNT(*) as count FROM fraternos")

    // Fraternos activos
    const fraternosActivos = await query<any[]>("SELECT COUNT(*) as count FROM fraternos WHERE estado = 'Activo'")

    // Fraternos inactivos
    const fraternosInactivos = await query<any[]>("SELECT COUNT(*) as count FROM fraternos WHERE estado = 'Inactivo'")

    // Total de bloques
    const totalBloques = await query<any[]>("SELECT COUNT(*) as count FROM bloques")

    // Total de inscripciones
    const totalInscripciones = await query<any[]>("SELECT COUNT(*) as count FROM inscripciones")

    // Fraternos por bloque
    const fraternosPorBloque = await query<any[]>(`
      SELECT b.nombre_bloque as bloque, COUNT(f.id) as cantidad
      FROM bloques b
      LEFT JOIN fraternos f ON f.bloque_id = b.id
      GROUP BY b.id, b.nombre_bloque
      ORDER BY cantidad DESC
    `)

    // Fraternos por género
    const fraternosPorGenero = await query<any[]>(`
      SELECT genero, COUNT(*) as cantidad
      FROM fraternos
      GROUP BY genero
    `)

    const stats: ReporteEstadisticas = {
      total_fraternos: totalFraternos[0].count,
      fraternos_activos: fraternosActivos[0].count,
      fraternos_inactivos: fraternosInactivos[0].count,
      total_bloques: totalBloques[0].count,
      total_inscripciones: totalInscripciones[0].count,
      fraternos_por_bloque: fraternosPorBloque,
      fraternos_por_genero: fraternosPorGenero,
    }

    return NextResponse.json({ success: true, data: stats })
  } catch (error) {
    console.error("[v0] Error fetching stats:", error)
    return NextResponse.json({ success: false, error: "Error al obtener estadísticas" }, { status: 500 })
  }
}
