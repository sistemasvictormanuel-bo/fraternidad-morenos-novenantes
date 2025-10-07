import { NextResponse } from "next/server"
import { getPool } from "@/lib/db"

export async function GET() {
  try {
    const pool = getPool()

    // GetTotalBloques
    const [bloquesResult] = await pool.query("CALL GetTotalBloques()")
    const totalBloques = (bloquesResult as any)[0]?.[0]?.total || 0

    // GetTotalFraternos
    const [fraternosResult] = await pool.query("CALL GetTotalFraternos()")
    const totalFraternos = (fraternosResult as any)[0]?.[0]?.total || 0

    // totalvaronesfratenros (varones)
    const [varonesResult] = await pool.query("CALL totalvaronesfraternos()")
    const totalVarones = (varonesResult as any)[0]?.[0]?.total || 0

    // totalInficGraternos (mujeres - asumiendo que este es el procedure para mujeres)
    const [mujeresResult] = await pool.query("CALL totalmfraternos()")
    const totalMujeres = (mujeresResult as any)[0]?.[0]?.total || 0

    // sp_fraternos_por_bloque
    const [fraternosPorBloqueResult] = await pool.query("CALL sp_fraternos_por_bloque()")
    const fraternosPorBloque = (fraternosPorBloqueResult as any)[0] || []

    // Consulta adicional para fraternos activos (si no hay procedure)
    const [activosResult] = await pool.query("SELECT COUNT(*) as total FROM fraternos WHERE estado = 'Activo'")
    const fraternosActivos = (activosResult as any)[0]?.total || 0

    // Consulta para próximos eventos
    const [eventosResult] = await pool.query("SELECT COUNT(*) as total FROM eventos WHERE fecha >= CURDATE()")
    const proximosEventos = (eventosResult as any)[0]?.total || 0

    return NextResponse.json({
      success: true,
      data: {
        totalFraternos,
        fraternosActivos,
        totalBloques,
        proximosEventos,
        totalVarones,
        totalMujeres,
        fraternosPorBloque: fraternosPorBloque.map((item: any) => ({
          bloque: item.nombre_bloque || item.bloque,
          cantidad: item.total || item.cantidad || 0,
        })),
      },
    })
  } catch (error) {
    console.error("[v0] Error fetching dashboard stats:", error)
    return NextResponse.json(
      {
        error: "Error al obtener estadísticas",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
