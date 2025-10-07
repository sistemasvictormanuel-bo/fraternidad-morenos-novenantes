"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
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
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Calendar, Edit, Trash2 } from "lucide-react"
import type { Evento, TipoEvento, EventoFormData } from "@/lib/types"
import { Toaster, toast } from "sonner"

export default function EventosPage() {
  const [eventos, setEventos] = useState<Evento[]>([])
  const [tiposEvento, setTiposEvento] = useState<TipoEvento[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingEvento, setEditingEvento] = useState<Evento | null>(null)
  const [formData, setFormData] = useState<EventoFormData>({
    nombre: "",
    descripcion: "",
    fecha_evento: "",
    tipo_evento_id: 0,
  })

  useEffect(() => {
    fetchEventos()
    fetchTiposEvento()
  }, [])

  const fetchEventos = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/eventos")
      const data = await response.json()
      if (data.success) {
        setEventos(data.data)
      }
    } catch (error) {
      console.error("[v0] Error fetching eventos:", error)
      toast.error("Error al cargar los eventos")
    } finally {
      setLoading(false)
    }
  }

  const fetchTiposEvento = async () => {
    try {
      const response = await fetch("/api/tipos-evento")
      const data = await response.json()
      if (data.success) {
        setTiposEvento(data.data)
      }
    } catch (error) {
      console.error("[v0] Error fetching tipos evento:", error)
      toast.error("Error al cargar los tipos de evento")
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      const url = editingEvento ? `/api/eventos/${editingEvento.id}` : "/api/eventos"
      const method = editingEvento ? "PUT" : "POST"

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        // Mostrar toast después de guardar exitosamente
        toast.success(editingEvento ? "Evento actualizado correctamente" : "Evento creado correctamente")
        fetchEventos()
        handleCloseDialog()
      } else {
        toast.error("Error al guardar el evento")
      }
    } catch (error) {
      console.error("[v0] Error saving evento:", error)
      toast.error("Error al guardar el evento")
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm("¿Está seguro de eliminar este evento?")) return

    try {
      const response = await fetch(`/api/eventos/${id}`, {
        method: "DELETE",
      })

      if (response.ok) {
        toast.success("Evento eliminado correctamente")
        fetchEventos()
      } else {
        toast.error("Error al eliminar el evento")
      }
    } catch (error) {
      console.error("[v0] Error deleting evento:", error)
      toast.error("Error al eliminar el evento")
    }
  }

  const handleEdit = (evento: Evento) => {
    setEditingEvento(evento)
    setFormData({
      nombre: evento.nombre,
      descripcion: evento.descripcion || "",
      fecha_evento: evento.fecha_evento,
      tipo_evento_id: evento.tipo_evento_id,
    })
    setDialogOpen(true)
  }

  const handleCloseDialog = () => {
    setDialogOpen(false)
    setEditingEvento(null)
    setFormData({
      nombre: "",
      descripcion: "",
      fecha_evento: "",
      tipo_evento_id: 0,
    })
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("es-BO", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Toaster a nivel superior */}
      <Toaster richColors position="top-right" />
      
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Eventos</h2>
          <p className="text-muted-foreground">Gestión de eventos de la fraternidad</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setEditingEvento(null)}>
              <Plus className="mr-2 h-4 w-4" />
              Nuevo Evento
            </Button>
          </DialogTrigger>
          <DialogContent>
            <form onSubmit={handleSubmit}>
              <DialogHeader>
                <DialogTitle>{editingEvento ? "Editar Evento" : "Nuevo Evento"}</DialogTitle>
                <DialogDescription>
                  {editingEvento ? "Actualizar información del evento" : "Crear un nuevo evento para la fraternidad"}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="nombre">Nombre del Evento *</Label>
                  <Input
                    id="nombre"
                    value={formData.nombre}
                    onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="descripcion">Descripción</Label>
                  <Textarea
                    id="descripcion"
                    value={formData.descripcion}
                    onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                    rows={3}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="fecha_evento">Fecha del Evento *</Label>
                  <Input
                    id="fecha_evento"
                    type="date"
                    value={formData.fecha_evento}
                    onChange={(e) => setFormData({ ...formData, fecha_evento: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tipo_evento_id">Tipo de Evento *</Label>
                  <Select
                    value={formData.tipo_evento_id.toString()}
                    onValueChange={(value) => setFormData({ ...formData, tipo_evento_id: Number.parseInt(value) })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      {tiposEvento.map((tipo) => (
                        <SelectItem key={tipo.id} value={tipo.id.toString()}>
                          {tipo.nombre}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={handleCloseDialog}>
                  Cancelar
                </Button>
                <Button type="submit">
                  Guardar
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="flex h-40 items-center justify-center">
          <p className="text-muted-foreground">Cargando...</p>
        </div>
      ) : eventos.length === 0 ? (
        <Card>
          <CardContent className="flex h-40 flex-col items-center justify-center gap-2">
            <Calendar className="h-12 w-12 text-muted-foreground" />
            <p className="text-muted-foreground">No hay eventos registrados</p>
            <Button variant="outline" size="sm" onClick={() => setDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Crear primer evento
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {eventos.map((evento) => (
            <Card key={evento.id} className="card-hover">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-xl">{evento.nombre}</CardTitle>
                    <CardDescription>{evento.tipo_evento?.nombre}</CardDescription>
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" onClick={() => handleEdit(evento)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(evento.id)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {evento.descripcion && <p className="text-sm text-muted-foreground">{evento.descripcion}</p>}
                  <div className="flex items-center gap-2 border-t pt-3">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">{formatDate(evento.fecha_evento)}</span>
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