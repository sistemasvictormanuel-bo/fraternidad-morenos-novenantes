import { NextResponse } from "next/server"
import mysql from "mysql2/promise"
import { dbConfig } from "@/lib/db-config"

export async function GET() {
  let connection

  try {
    // Conexión con la base
    connection = await mysql.createConnection(dbConfig)

    // Total de bloques
    const [bloquesRows] = await connection.query(`SELECT COUNT(*) AS total FROM bloques`)
    const totalBloques = (bloquesRows as any)[0]?.total || 0

    // Total de fraternos
    const [fraternosRows] = await connection.query(`SELECT COUNT(*) AS total FROM fraternos`)
    const totalFraternos = (fraternosRows as any)[0]?.total || 0

    // Fraternos activos
    const [activosRows] = await connection.query(`SELECT COUNT(*) AS total FROM fraternos WHERE estado = 'Activo'`)
    const fraternosActivos = (activosRows as any)[0]?.total || 0

    // Total varones y mujeres
    const [varonesRows] = await connection.query(`SELECT COUNT(*) AS total FROM fraternos WHERE genero = 'Masculino'`)
    const totalVarones = (varonesRows as any)[0]?.total || 0
    const [mujeresRows] = await connection.query(`SELECT COUNT(*) AS total FROM fraternos WHERE genero = 'Femenino'`)
    const totalMujeres = (mujeresRows as any)[0]?.total || 0

    // Fraternos por bloque
    const [fraternosPorBloqueRows] = await connection.query(`
      SELECT b.nombre_bloque AS bloque, COUNT(f.id) AS cantidad
      FROM bloques b
      LEFT JOIN fraternos f ON f.bloque_id = b.id
      GROUP BY b.id, b.nombre_bloque
      ORDER BY b.nombre_bloque
    `)
    const fraternosPorBloque = fraternosPorBloqueRows as any[]

    // Respuesta final con cache deshabilitado
    return NextResponse.json(
      {
        success: true,
        data: {
          total_fraternos: totalFraternos,
          fraternos_activos: fraternosActivos,
          fraternos_inactivos: totalFraternos - fraternosActivos,
          total_bloques: totalBloques,
          total_inscripciones: 0, // si luego agregas inscripciones
          fraternos_por_bloque: fraternosPorBloque.map(item => ({
            bloque: item.bloque,
            cantidad: item.cantidad,
          })),
          fraternos_por_genero: [
            { genero: "Masculino", cantidad: totalVarones },
            { genero: "Femenino", cantidad: totalMujeres },
          ],
        },
      },
      {
        headers: {
          "Cache-Control": "no-store", // ⚡ Importante: siempre datos frescos
        },
      }
    )
  } catch (error) {
    console.error("[v0] Error fetching dashboard stats:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Error al obtener estadísticas",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500, headers: { "Cache-Control": "no-store" } }
    )
  } finally {
    if (connection) await connection.end()
  }
}
