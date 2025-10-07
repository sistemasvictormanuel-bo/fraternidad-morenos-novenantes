"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Edit, Trash2, Users, Layers } from "lucide-react"
import type { Fraterno, BloqueFormData } from "@/lib/types"
import { Toaster, toast } from "sonner"

export default function BloquesPage() {
  const [bloques, setBloques] = useState<any[]>([])
  const [fraternos, setFraternos] = useState<Fraterno[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingBloque, setEditingBloque] = useState<any | null>(null)
  const [formData, setFormData] = useState<BloqueFormData>({
    nombre_bloque: "",
    estado: "Activo",
    fraterno_id: undefined,
    tipobloque: "Independientes",
  })

  useEffect(() => {
    fetchBloques()
    fetchFraternos()
  }, [])

  const fetchBloques = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/bloques")
      const data = await response.json()
      if (data.success) {
        setBloques(data.data)
      }
    } catch (error) {
      console.error("[v0] Error fetching bloques:", error)
      toast.error("Error al cargar los bloques")
    } finally {
      setLoading(false)
    }
  }

  const fetchFraternos = async () => {
    try {
      const response = await fetch("/api/fraternos")
      const data = await response.json()
      if (data.success) {
        setFraternos(data.data)
      }
    } catch (error) {
      console.error("[v0] Error fetching fraternos:", error)
      toast.error("Error al cargar los fraternos")
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      const url = editingBloque ? `/api/bloques/${editingBloque.id}` : "/api/bloques"
      const method = editingBloque ? "PUT" : "POST"

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        toast.success(editingBloque ? "Bloque actualizado correctamente" : "Bloque creado correctamente")
        fetchBloques()
        handleCloseDialog()
      } else {
        const data = await response.json()
        toast.error(data.error || "Error al guardar el bloque")
      }
    } catch (error) {
      console.error("[v0] Error saving bloque:", error)
      toast.error("Error al guardar el bloque")
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm("¿Está seguro de eliminar este bloque?")) return

    try {
      const response = await fetch(`/api/bloques/${id}`, {
        method: "DELETE",
      })

      if (response.ok) {
        toast.success("Bloque eliminado correctamente")
        fetchBloques()
      } else {
        const data = await response.json()
        toast.error(data.error || "Error al eliminar el bloque")
      }
    } catch (error) {
      console.error("[v0] Error deleting bloque:", error)
      toast.error("Error al eliminar el bloque")
    }
  }

  const handleEdit = (bloque: any) => {
    setEditingBloque(bloque)
    setFormData({
      nombre_bloque: bloque.nombre_bloque,
      estado: bloque.estado,
      fraterno_id: bloque.fraterno_id,
      tipobloque: bloque.tipobloque,
    })
    setDialogOpen(true)
  }

  const handleCloseDialog = () => {
    setDialogOpen(false)
    setEditingBloque(null)
    setFormData({
      nombre_bloque: "",
      estado: "Activo",
      fraterno_id: undefined,
      tipobloque: "Independientes",
    })
  }

  const getTipoBadge = (tipo: string) => {
    const colors: Record<string, "default" | "secondary" | "outline"> = {
      Tropa: "default",
      Independientes: "secondary",
      Especial: "outline",
    }
    return <Badge variant={colors[tipo] || "default"}>{tipo}</Badge>
  }

  const getEstadoBadge = (estado: string) => {
    return <Badge variant={estado === "Activo" ? "default" : "secondary"}>{estado}</Badge>
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Toaster a nivel superior */}
      <Toaster richColors position="top-right" />
      
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Bloques</h2>
          <p className="text-muted-foreground">Gestión de bloques de la fraternidad</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setEditingBloque(null)}>
              <Plus className="mr-2 h-4 w-4" />
              Nuevo Bloque
            </Button>
          </DialogTrigger>
          <DialogContent>
            <form onSubmit={handleSubmit}>
              <DialogHeader>
                <DialogTitle>{editingBloque ? "Editar Bloque" : "Nuevo Bloque"}</DialogTitle>
                <DialogDescription>
                  {editingBloque
                    ? "Actualizar información del bloque"
                    : "Crear un nuevo bloque para organizar fraternos"}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="nombre_bloque">Nombre del Bloque *</Label>
                  <Input
                    id="nombre_bloque"
                    value={formData.nombre_bloque}
                    onChange={(e) => setFormData({ ...formData, nombre_bloque: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tipobloque">Tipo de Bloque *</Label>
                  <Select
                    value={formData.tipobloque}
                    onValueChange={(value) => setFormData({ ...formData, tipobloque: value as any })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Tropa">Tropa</SelectItem>
                      <SelectItem value="Independientes">Independientes</SelectItem>
                      <SelectItem value="Especial">Especial</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="fraterno_id">Responsable del Bloque</Label>
                  <Select
                    value={formData.fraterno_id?.toString()}
                    onValueChange={(value) => setFormData({ ...formData, fraterno_id: Number.parseInt(value) })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar responsable" />
                    </SelectTrigger>
                    <SelectContent>
                      {fraternos.map((fraterno) => (
                        <SelectItem key={fraterno.id} value={fraterno.id.toString()}>
                          {fraterno.nombre}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="estado">Estado *</Label>
                  <Select
                    value={formData.estado}
                    onValueChange={(value) => setFormData({ ...formData, estado: value as any })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Activo">Activo</SelectItem>
                      <SelectItem value="Inactivo">Inactivo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={handleCloseDialog}>
                  Cancelar
                </Button>
                <Button type="submit">Guardar</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="flex h-40 items-center justify-center">
          <p className="text-muted-foreground">Cargando...</p>
        </div>
      ) : bloques.length === 0 ? (
        <Card>
          <CardContent className="flex h-40 flex-col items-center justify-center gap-2">
            <Layers className="h-12 w-12 text-muted-foreground" />
            <p className="text-muted-foreground">No hay bloques registrados</p>
            <Button variant="outline" size="sm" onClick={() => setDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Crear primer bloque
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {bloques.map((bloque) => (
            <Card key={bloque.id} className="card-hover">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-xl">{bloque.nombre_bloque}</CardTitle>
                    <CardDescription>{bloque.responsable_nombre || "Sin responsable asignado"}</CardDescription>
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" onClick={() => handleEdit(bloque)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(bloque.id)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Tipo:</span>
                    {getTipoBadge(bloque.tipobloque)}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Estado:</span>
                    {getEstadoBadge(bloque.estado)}
                  </div>
                  <div className="flex items-center justify-between border-t pt-3">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">Miembros:</span>
                    </div>
                    <span className="text-lg font-bold">{bloque.total_miembros || 0}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}