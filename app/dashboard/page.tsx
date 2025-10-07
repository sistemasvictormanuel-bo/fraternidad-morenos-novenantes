"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, Layers, Calendar, TrendingUp, UserCheck } from "lucide-react"

interface DashboardStats {
  totalFraternos: number
  fraternosActivos: number
  totalBloques: number
  proximosEventos: number
  totalVarones: number
  totalMujeres: number
  fraternosPorBloque: { bloque: string; cantidad: number }[]
}

function StatCard({
  title,
  value,
  description,
  icon: Icon,
  trend,
}: {
  title: string
  value: string | number
  description: string
  icon: React.ElementType
  trend?: string
}) {
  return (
    <Card className="card-hover">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className="text-xs text-muted-foreground">{description}</p>
        {trend && (
          <div className="mt-2 flex items-center text-xs text-green-600">
            <TrendingUp className="mr-1 h-3 w-3" />
            {trend}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats>({
    totalFraternos: 0,
    fraternosActivos: 0,
    totalBloques: 0,
    proximosEventos: 0,
    totalVarones: 0,
    totalMujeres: 0,
    fraternosPorBloque: [],
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      const response = await fetch("/api/dashboard/stats")
      const data = await response.json()

      if (data.success) {
        setStats(data.data)
      }
    } catch (error) {
      console.error("[v0] Error fetching dashboard stats:", error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <p className="text-muted-foreground">Cargando estadísticas...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
        <p className="text-muted-foreground">Bienvenido al sistema de gestión de la fraternidad</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Fraternos"
          value={stats.totalFraternos}
          description="Miembros registrados"
          icon={Users}
        />
        <StatCard
          title="Fraternos Activos"
          value={stats.fraternosActivos}
          description="Miembros activos"
          icon={UserCheck}
        />
        <StatCard title="Bloques" value={stats.totalBloques} description="Bloques registrados" icon={Layers} />
        <StatCard
          title="Próximos Eventos"
          value={stats.proximosEventos}
          description="Eventos programados"
          icon={Calendar}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Distribución por Género</CardTitle>
            <CardDescription>Fraternos según género</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100">
                    <Users className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Varones</p>
                    <p className="text-xs text-muted-foreground">Miembros masculinos</p>
                  </div>
                </div>
                <span className="text-2xl font-bold">{stats.totalVarones}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-pink-100">
                    <Users className="h-5 w-5 text-pink-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Mujeres</p>
                    <p className="text-xs text-muted-foreground">Miembros femeninos</p>
                  </div>
                </div>
                <span className="text-2xl font-bold">{stats.totalMujeres}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Acciones Rápidas</CardTitle>
            <CardDescription>Accesos directos a funciones principales</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <a
              href="/dashboard/fraternos/nuevo"
              className="flex items-center gap-3 rounded-lg border p-3 transition-colors hover:bg-accent"
            >
              <Users className="h-5 w-5 text-primary" />
              <div>
                <p className="text-sm font-medium">Registrar Fraterno</p>
                <p className="text-xs text-muted-foreground">Agregar nuevo miembro</p>
              </div>
            </a>
            <a
              href="/dashboard/bloques"
              className="flex items-center gap-3 rounded-lg border p-3 transition-colors hover:bg-accent"
            >
              <Layers className="h-5 w-5 text-primary" />
              <div>
                <p className="text-sm font-medium">Gestionar Bloques</p>
                <p className="text-xs text-muted-foreground">Organizar grupos</p>
              </div>
            </a>
            <a
              href="/dashboard/eventos"
              className="flex items-center gap-3 rounded-lg border p-3 transition-colors hover:bg-accent"
            >
              <Calendar className="h-5 w-5 text-primary" />
              <div>
                <p className="text-sm font-medium">Crear Evento</p>
                <p className="text-xs text-muted-foreground">Programar actividad</p>
              </div>
            </a>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Distribución por Bloques</CardTitle>
          <CardDescription>Cantidad de fraternos por cada bloque</CardDescription>
        </CardHeader>
        <CardContent>
          {stats.fraternosPorBloque.length === 0 ? (
            <div className="flex h-40 items-center justify-center text-muted-foreground">
              <p>No hay datos disponibles. Comienza registrando fraternos y bloques.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {stats.fraternosPorBloque.map((item, index) => (
                <div key={index} className="flex items-center justify-between rounded-lg border p-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                      <Layers className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">{item.bloque}</p>
                      <p className="text-xs text-muted-foreground">Bloque</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold">{item.cantidad}</p>
                    <p className="text-xs text-muted-foreground">fraternos</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
