"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Search, Edit, Trash2, Fingerprint, Eye } from "lucide-react"
import type { Fraterno, Bloque } from "@/lib/types"
import { Toaster, toast } from "sonner"

export default function FraternosPage() {
  const [fraternos, setFraternos] = useState<Fraterno[]>([])
  const [bloques, setBloques] = useState<Bloque[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [estadoFilter, setEstadoFilter] = useState<string>("all")
  const [bloqueFilter, setBloqueFilter] = useState<string>("all")

  useEffect(() => {
    fetchFraternos()
    fetchBloques()
  }, [search, estadoFilter, bloqueFilter])

  const fetchFraternos = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (search) params.append("search", search)
      if (estadoFilter !== "all") params.append("estado", estadoFilter)
      if (bloqueFilter !== "all") params.append("bloque_id", bloqueFilter)

      const response = await fetch(`/api/fraternos?${params.toString()}`)
      const data = await response.json()

      if (data.success) {
        setFraternos(data.data)
      } else {
        toast.error("Error al cargar los fraternos")
      }
    } catch (error) {
      console.error("[v0] Error fetching fraternos:", error)
      toast.error("Error al cargar los fraternos")
    } finally {
      setLoading(false)
    }
  }

  const fetchBloques = async () => {
    try {
      const response = await fetch("/api/bloques")
      const data = await response.json()
      if (data.success) {
        setBloques(data.data)
      }
    } catch (error) {
      console.error("Error fetching bloques:", error)
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm("¿Está seguro de eliminar este fraterno?")) return

    try {
      const response = await fetch(`/api/fraternos/${id}`, {
        method: "DELETE",
      })

      if (response.ok) {
        toast.success("Fraterno eliminado correctamente")
        fetchFraternos()
      } else {
        const data = await response.json()
        toast.error(data.error || "Error al eliminar el fraterno")
      }
    } catch (error) {
      console.error("[v0] Error deleting fraterno:", error)
      toast.error("Error al eliminar el fraterno")
    }
  }

  const getEstadoBadge = (estado: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive"> = {
      Activo: "default",
      Inactivo: "secondary",
      Suspendido: "destructive",
    }
    return <Badge variant={variants[estado] || "default"}>{estado}</Badge>
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Toaster a nivel superior */}
      <Toaster richColors position="top-right" />
      
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Fraternos</h2>
          <p className="text-muted-foreground">Gestión de miembros de la fraternidad</p>
        </div>
        <Link href="/dashboard/fraternos/nuevo">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Nuevo Fraterno
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lista de Fraternos</CardTitle>
          <CardDescription>Buscar y filtrar fraternos registrados</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4 flex flex-col gap-4 sm:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar por nombre, CI o celular..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={estadoFilter} onValueChange={setEstadoFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los estados</SelectItem>
                <SelectItem value="Activo">Activo</SelectItem>
                <SelectItem value="Inactivo">Inactivo</SelectItem>
                <SelectItem value="Suspendido">Suspendido</SelectItem>
              </SelectContent>
            </Select>
            <Select value={bloqueFilter} onValueChange={setBloqueFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Bloque" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los bloques</SelectItem>
                {bloques.map((bloque) => (
                  <SelectItem key={bloque.id} value={bloque.id.toString()}>
                    {bloque.nombre_bloque}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {loading ? (
            <div className="flex h-40 items-center justify-center">
              <p className="text-muted-foreground">Cargando...</p>
            </div>
          ) : fraternos.length === 0 ? (
            <div className="flex h-40 flex-col items-center justify-center gap-2">
              <p className="text-muted-foreground">No hay fraternos registrados</p>
              <Link href="/dashboard/fraternos/nuevo">
                <Button variant="outline" size="sm">
                  <Plus className="mr-2 h-4 w-4" />
                  Registrar primer fraterno
                </Button>
              </Link>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nombre</TableHead>
                    <TableHead>CI</TableHead>
                    <TableHead>Celular</TableHead>
                    <TableHead>Género</TableHead>
                    <TableHead>Bloque</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Huella</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {fraternos.map((fraterno) => (
                    <TableRow key={fraterno.id} className="table-row-hover">
                      <TableCell className="font-medium">{fraterno.nombre}</TableCell>
                      <TableCell>{fraterno.ci}</TableCell>
                      <TableCell>{fraterno.celular}</TableCell>
                      <TableCell>{fraterno.genero}</TableCell>
                      <TableCell>
                        {fraterno.nombre_bloque || <span className="text-muted-foreground">Sin asignar</span>}
                      </TableCell>
                      <TableCell>{getEstadoBadge(fraterno.estado)}</TableCell>
                      <TableCell>
                        {fraterno.huella_template ? (
                          <Fingerprint className="h-4 w-4 text-green-600" />
                        ) : (
                          <span className="text-xs text-muted-foreground">No registrada</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Link href={`/dashboard/fraternos/${fraterno.id}/kardex`}>
                            <Button variant="ghost" size="icon" title="Ver Kardex">
                              <Eye className="h-4 w-4" />
                            </Button>
                          </Link>
                          <Link href={`/dashboard/fraternos/${fraterno.id}`}>
                            <Button variant="ghost" size="icon" title="Editar">
                              <Edit className="h-4 w-4" />
                            </Button>
                          </Link>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(fraterno.id)}
                            title="Eliminar"
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
