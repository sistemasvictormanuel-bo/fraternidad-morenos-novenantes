"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Fingerprint, Trash2, Calendar, Users } from "lucide-react"
import type { Inscripcion, Fraterno, Evento } from "@/lib/types"

export default function InscripcionesPage() {
  const [inscripciones, setInscripciones] = useState<Inscripcion[]>([])
  const [fraternos, setFraternos] = useState<Fraterno[]>([])
  const [eventos, setEventos] = useState<Evento[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [selectedFraterno, setSelectedFraterno] = useState<number>(0)
  const [selectedEvento, setSelectedEvento] = useState<number>(0)
  const [eventoFilter, setEventoFilter] = useState<string>("all")

  useEffect(() => {
    fetchInscripciones()
    fetchFraternos()
    fetchEventos()
  }, [eventoFilter])

  const fetchInscripciones = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (eventoFilter !== "all") params.append("evento_id", eventoFilter)

      const response = await fetch(`/api/inscripciones?${params.toString()}`)
      const data = await response.json()
      if (data.success) {
        setInscripciones(data.data)
      }
    } catch (error) {
      console.error("[v0] Error fetching inscripciones:", error)
    } finally {
      setLoading(false)
    }
  }

  const fetchFraternos = async () => {
    try {
      const response = await fetch("/api/fraternos?estado=Activo")
      const data = await response.json()
      if (data.success) {
        setFraternos(data.data)
      }
    } catch (error) {
      console.error("[v0] Error fetching fraternos:", error)
    }
  }

  const fetchEventos = async () => {
    try {
      const response = await fetch("/api/eventos")
      const data = await response.json()
      if (data.success) {
        setEventos(data.data)
      }
    } catch (error) {
      console.error("[v0] Error fetching eventos:", error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!selectedFraterno || !selectedEvento) {
      alert("Debe seleccionar un fraterno y un evento")
      return
    }

    try {
      const response = await fetch("/api/inscripciones", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fraterno_id: selectedFraterno,
          evento_id: selectedEvento,
        }),
      })

      if (response.ok) {
        fetchInscripciones()
        handleCloseDialog()
      } else {
        const data = await response.json()
        alert(data.error || "Error al crear inscripción")
      }
    } catch (error) {
      console.error("[v0] Error creating inscripcion:", error)
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm("¿Está seguro de eliminar esta inscripción?")) return

    try {
      const response = await fetch(`/api/inscripciones/${id}`, {
        method: "DELETE",
      })

      if (response.ok) {
        fetchInscripciones()
      }
    } catch (error) {
      console.error("[v0] Error deleting inscripcion:", error)
    }
  }

  const handleCloseDialog = () => {
    setDialogOpen(false)
    setSelectedFraterno(0)
    setSelectedEvento(0)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("es-BO", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  // Agrupar inscripciones por evento
  const inscripcionesPorEvento = inscripciones.reduce(
    (acc, inscripcion) => {
      const eventoNombre = inscripcion.evento?.nombre || "Sin evento"
      if (!acc[eventoNombre]) {
        acc[eventoNombre] = []
      }
      acc[eventoNombre].push(inscripcion)
      return acc
    },
    {} as Record<string, Inscripcion[]>,
  )

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Inscripciones</h2>
          <p className="text-muted-foreground">Gestión de inscripciones a eventos</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Nueva Inscripción
            </Button>
          </DialogTrigger>
          <DialogContent>
            <form onSubmit={handleSubmit}>
              <DialogHeader>
                <DialogTitle>Nueva Inscripción</DialogTitle>
                <DialogDescription>Inscribir un fraterno a un evento</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="fraterno_id">Fraterno *</Label>
                  <Select
                    value={selectedFraterno.toString()}
                    onValueChange={(value) => setSelectedFraterno(Number.parseInt(value))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar fraterno" />
                    </SelectTrigger>
                    <SelectContent>
                      {fraternos.map((fraterno) => (
                        <SelectItem key={fraterno.id} value={fraterno.id.toString()}>
                          {fraterno.nombre} - {fraterno.ci}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="evento_id">Evento *</Label>
                  <Select
                    value={selectedEvento.toString()}
                    onValueChange={(value) => setSelectedEvento(Number.parseInt(value))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar evento" />
                    </SelectTrigger>
                    <SelectContent>
                      {eventos.map((evento) => (
                        <SelectItem key={evento.id} value={evento.id.toString()}>
                          {evento.nombre} - {new Date(evento.fecha_evento).toLocaleDateString("es-BO")}
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
                <Button type="submit">Inscribir</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Lista de Inscripciones</CardTitle>
              <CardDescription>Fraternos inscritos a eventos</CardDescription>
            </div>
            <Select value={eventoFilter} onValueChange={setEventoFilter}>
              <SelectTrigger className="w-[250px]">
                <SelectValue placeholder="Filtrar por evento" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los eventos</SelectItem>
                {eventos.map((evento) => (
                  <SelectItem key={evento.id} value={evento.id.toString()}>
                    {evento.nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex h-40 items-center justify-center">
              <p className="text-muted-foreground">Cargando...</p>
            </div>
          ) : inscripciones.length === 0 ? (
            <div className="flex h-40 flex-col items-center justify-center gap-2">
              <Fingerprint className="h-12 w-12 text-muted-foreground" />
              <p className="text-muted-foreground">No hay inscripciones registradas</p>
              <Button variant="outline" size="sm" onClick={() => setDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Crear primera inscripción
              </Button>
            </div>
          ) : (
            <div className="space-y-6">
              {Object.entries(inscripcionesPorEvento).map(([eventoNombre, inscripcionesEvento]) => (
                <div key={eventoNombre} className="space-y-3">
                  <div className="flex items-center gap-2 border-b pb-2">
                    <Calendar className="h-5 w-5 text-primary" />
                    <h3 className="text-lg font-semibold">{eventoNombre}</h3>
                    <span className="text-sm text-muted-foreground">({inscripcionesEvento.length} inscritos)</span>
                  </div>
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Fraterno</TableHead>
                          <TableHead>CI</TableHead>
                          <TableHead>Celular</TableHead>
                          <TableHead>Bloque</TableHead>
                          <TableHead>Fecha Inscripción</TableHead>
                          <TableHead className="text-right">Acciones</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {inscripcionesEvento.map((inscripcion) => (
                          <TableRow key={inscripcion.id} className="table-row-hover">
                            <TableCell className="font-medium">{inscripcion.fraterno?.nombre}</TableCell>
                            <TableCell>{inscripcion.fraterno?.ci}</TableCell>
                            <TableCell>{inscripcion.fraterno?.celular}</TableCell>
                            <TableCell>
                              {inscripcion.fraterno?.bloque?.nombre_bloque || (
                                <span className="text-muted-foreground">Sin asignar</span>
                              )}
                            </TableCell>
                            <TableCell>{formatDate(inscripcion.fecha_inscripcion)}</TableCell>
                            <TableCell className="text-right">
                              <Button variant="ghost" size="icon" onClick={() => handleDelete(inscripcion.id)}>
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Inscripciones</CardTitle>
            <Fingerprint className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{inscripciones.length}</div>
            <p className="text-xs text-muted-foreground">Inscripciones registradas</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Eventos Activos</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Object.keys(inscripcionesPorEvento).length}</div>
            <p className="text-xs text-muted-foreground">Eventos con inscripciones</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Fraternos Participantes</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{new Set(inscripciones.map((i) => i.fraterno_id)).size}</div>
            <p className="text-xs text-muted-foreground">Fraternos únicos inscritos</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
