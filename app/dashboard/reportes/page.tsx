"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts"
import { Download, Users, Layers, Calendar, TrendingUp, Shirt } from "lucide-react"
import type { ReporteEstadisticas } from "@/lib/types"


const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8", "#82CA9D"]

export default function ReportesPage() {
  const [stats, setStats] = useState<ReporteEstadisticas | null>(null)
  const [loading, setLoading] = useState(true)
  const [showDropdown, setShowDropdown] = useState(false)

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/dashboard/stats")
      const data = await response.json()
      if (data.success) {
        setStats(data.data)
      }
    } catch (error) {
      console.error("[v0] Error fetching stats:", error)
    } finally {
      setLoading(false)
    }
  }
  const [exporting, setExporting] = useState<string | null>(null)

  const handleExportPDF = async (tipo: string) => {
    try {
      setExporting(tipo)
      setShowDropdown(false)
      
      const response = await fetch(`/api/reportes/${tipo}`)
      
      if (!response.ok) {
        throw new Error('Error al generar el reporte')
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      
      // Nombres personalizados para cada reporte
      const nombresArchivos = {
        'sin-huella': `fraternos-sin-huella-${new Date().toISOString().split('T')[0]}.pdf`,
        'tallas-ropa': `tallas-ropa-${new Date().toISOString().split('T')[0]}.pdf`
      }
      
      a.download = nombresArchivos[tipo as keyof typeof nombresArchivos] || `reporte-${tipo}.pdf`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      
    } catch (error) {
      console.error('Error exportando PDF:', error)
      alert('Error al generar el reporte PDF')
    } finally {
      setExporting(null)
    }
  }


  const handleExportExcel = () => {
    alert("Funcionalidad de exportación a Excel - Por implementar")
  }

  if (loading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <p className="text-muted-foreground">Cargando reportes...</p>
      </div>
    )
  }

  if (!stats) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <p className="text-muted-foreground">No hay datos disponibles</p>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Reportes</h2>
          <p className="text-muted-foreground">Estadísticas y análisis de la fraternidad</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExportExcel}>
            <Download className="mr-2 h-4 w-4" />
            Exportar Excel
          </Button>
          <Button 
  variant="secondary" 
  onClick={fetchStats}
  className="ml-2"
>
  🔄 Actualizar Stats
</Button>

          {/* NUEVO: Dropdown para reportes personalizados */}
          <div className="relative">
            <Button 
              variant="default" 
              disabled={exporting !== null}
              onClick={() => setShowDropdown(!showDropdown)}
            >
              <Download className="mr-2 h-4 w-4" />
              {exporting ? 'Generando...' : 'Reportes Personalizados'}
            </Button>
            
            {showDropdown && (
              <div className="absolute top-full left-0 mt-1 w-64 bg-white border border-gray-200 rounded-md shadow-lg z-10">
                <button 
                  onClick={() => handleExportPDF('sin-huella')}
                  className="flex items-center w-full px-4 py-3 text-sm hover:bg-gray-50 border-b border-gray-100"
                  disabled={exporting !== null}
                >
                  <Users className="mr-3 h-4 w-4 text-blue-500" />
                  <div className="text-left">
                    <div className="font-medium">Fraternos sin Huella</div>
                    <div className="text-xs text-muted-foreground">Lista de miembros sin huella registrada</div>
                  </div>
                </button>
                <button 
                  onClick={() => handleExportPDF('tallas-ropa')}
                  className="flex items-center w-full px-4 py-3 text-sm hover:bg-gray-50"
                  disabled={exporting !== null}
                >
                  <Shirt className="mr-3 h-4 w-4 text-green-500" />
                  <div className="text-left">
                    <div className="font-medium">Tallas de Ropa</div>
                    <div className="text-xs text-muted-foreground">Reporte de tallas por bloque</div>
                  </div>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Fraternos</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total_fraternos}</div>
            <p className="text-xs text-muted-foreground">Miembros registrados</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Fraternos Activos</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.fraternos_activos}</div>
            <p className="text-xs text-muted-foreground">
              {stats.total_fraternos > 0
                ? `${((stats.fraternos_activos / stats.total_fraternos) * 100).toFixed(1)}% del total`
                : "0% del total"}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Bloques</CardTitle>
            <Layers className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total_bloques}</div>
            <p className="text-xs text-muted-foreground">Bloques organizados</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Inscripciones</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total_inscripciones}</div>
            <p className="text-xs text-muted-foreground">Inscripciones a eventos</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="bloques" className="space-y-4">
        <TabsList>
          <TabsTrigger value="bloques">Distribución por Bloques</TabsTrigger>
          <TabsTrigger value="genero">Distribución por Género</TabsTrigger>
          <TabsTrigger value="estado">Estado de Fraternos</TabsTrigger>
        </TabsList>

        <TabsContent value="bloques" className="space-y-4">
          <Card>

            <CardHeader>
              <CardTitle>Fraternos por Bloque</CardTitle>
              <CardDescription>Cantidad de miembros en cada bloque</CardDescription>
            </CardHeader>
            <CardContent>
              {stats.fraternos_por_bloque.length > 0 ? (
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={stats.fraternos_por_bloque}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="bloque" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="cantidad" fill="#8884d8" name="Fraternos" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-[400px] items-center justify-center text-muted-foreground">
                  No hay datos disponibles
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Detalle por Bloque</CardTitle>
              <CardDescription>Información detallada de cada bloque</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {stats.fraternos_por_bloque.length > 0 ? (
                  stats.fraternos_por_bloque.map((bloque, index) => (
                    <div key={index} className="flex items-center justify-between border-b pb-3 last:border-0">
                      <div className="flex items-center gap-3">
                        <div
                          className="h-10 w-10 rounded-lg flex items-center justify-center text-white font-bold"
                          style={{ backgroundColor: COLORS[index % COLORS.length] }}
                        >
                          {bloque.cantidad}
                        </div>
                        <div>
                          <p className="font-medium">{bloque.bloque}</p>
                          <p className="text-sm text-muted-foreground">
                            {stats.total_fraternos > 0
                              ? `${((bloque.cantidad / stats.total_fraternos) * 100).toFixed(1)}% del total`
                              : "0% del total"}
                          </p>
                        </div>
                      </div>
                      <span className="text-2xl font-bold">{bloque.cantidad}</span>
                    </div>
                  ))
                ) : (
                  <p className="text-center text-muted-foreground">No hay bloques con fraternos asignados</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="genero" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Distribución por Género</CardTitle>
                <CardDescription>Proporción de fraternos por género</CardDescription>
              </CardHeader>
              <CardContent>
                {stats.fraternos_por_genero.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={stats.fraternos_por_genero}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ genero, cantidad }) => `${genero}: ${cantidad}`}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="cantidad"
                      >
                        {stats.fraternos_por_genero.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex h-[300px] items-center justify-center text-muted-foreground">
                    No hay datos disponibles
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Detalle por Género</CardTitle>
                <CardDescription>Cantidad y porcentaje por género</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {stats.fraternos_por_genero.length > 0 ? (
                    stats.fraternos_por_genero.map((genero, index) => (
                      <div key={index} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-medium">{genero.genero}</span>
                          <span className="text-2xl font-bold">{genero.cantidad}</span>
                        </div>
                        <div className="h-2 w-full rounded-full bg-muted">
                          <div
                            className="h-2 rounded-full transition-all"
                            style={{
                              width: `${stats.total_fraternos > 0 ? (genero.cantidad / stats.total_fraternos) * 100 : 0}%`,
                              backgroundColor: COLORS[index % COLORS.length],
                            }}
                          />
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {stats.total_fraternos > 0
                            ? `${((genero.cantidad / stats.total_fraternos) * 100).toFixed(1)}% del total`
                            : "0% del total"}
                        </p>
                      </div>
                    ))
                  ) : (
                    <p className="text-center text-muted-foreground">No hay datos disponibles</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="estado" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle>Fraternos Activos</CardTitle>
                <CardDescription>Miembros con estado activo</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-bold text-green-600">{stats.fraternos_activos}</div>
                <p className="text-sm text-muted-foreground mt-2">
                  {stats.total_fraternos > 0
                    ? `${((stats.fraternos_activos / stats.total_fraternos) * 100).toFixed(1)}% del total`
                    : "0% del total"}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Fraternos Inactivos</CardTitle>
                <CardDescription>Miembros con estado inactivo</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-bold text-orange-600">{stats.fraternos_inactivos}</div>
                <p className="text-sm text-muted-foreground mt-2">
                  {stats.total_fraternos > 0
                    ? `${((stats.fraternos_inactivos / stats.total_fraternos) * 100).toFixed(1)}% del total`
                    : "0% del total"}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Total General</CardTitle>
                <CardDescription>Todos los fraternos registrados</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-bold">{stats.total_fraternos}</div>
                <p className="text-sm text-muted-foreground mt-2">Miembros en el sistema</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Comparación de Estados</CardTitle>
              <CardDescription>Visualización de estados de fraternos</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart
                  data={[
                    { estado: "Activos", cantidad: stats.fraternos_activos },
                    { estado: "Inactivos", cantidad: stats.fraternos_inactivos },
                  ]}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="estado" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="cantidad" fill="#8884d8" name="Fraternos" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Card>

        <CardHeader>
          <CardTitle>Resumen General</CardTitle>
          <CardDescription>Información consolidada de la fraternidad</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <h4 className="font-semibold">Estadísticas de Miembros</h4>
              <ul className="space-y-1 text-sm">
                <li className="flex justify-between">
                  <span className="text-muted-foreground">Total de fraternos:</span>
                  <span className="font-medium">{stats.total_fraternos}</span>
                </li>
                <li className="flex justify-between">
                  <span className="text-muted-foreground">Fraternos activos:</span>
                  <span className="font-medium text-green-600">{stats.fraternos_activos}</span>
                </li>
                <li className="flex justify-between">
                  <span className="text-muted-foreground">Fraternos inactivos:</span>
                  <span className="font-medium text-orange-600">{stats.fraternos_inactivos}</span>
                </li>
                <li className="flex justify-between">
                  <span className="text-muted-foreground">Tasa de actividad:</span>
                  <span className="font-medium">
                    {stats.total_fraternos > 0
                      ? `${((stats.fraternos_activos / stats.total_fraternos) * 100).toFixed(1)}%`
                      : "0%"}
                  </span>
                </li>
              </ul>
            </div>
            <div className="space-y-2">
              <h4 className="font-semibold">Organización</h4>
              <ul className="space-y-1 text-sm">
                <li className="flex justify-between">
                  <span className="text-muted-foreground">Total de bloques:</span>
                  <span className="font-medium">{stats.total_bloques}</span>
                </li>
                <li className="flex justify-between">
                  <span className="text-muted-foreground">Promedio por bloque:</span>
                  <span className="font-medium">
                    {stats.total_bloques > 0 ? (stats.total_fraternos / stats.total_bloques).toFixed(1) : "0"}
                  </span>
                </li>
                <li className="flex justify-between">
                  <span className="text-muted-foreground">Total inscripciones:</span>
                  <span className="font-medium">{stats.total_inscripciones}</span>
                </li>
                <li className="flex justify-between">
                  <span className="text-muted-foreground">Promedio inscripciones:</span>
                  <span className="font-medium">
                    {stats.total_fraternos > 0 ? (stats.total_inscripciones / stats.total_fraternos).toFixed(1) : "0"}
                  </span>
                </li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
