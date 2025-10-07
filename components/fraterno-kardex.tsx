"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { ArrowLeft, Edit, User, Phone, Calendar, CreditCard, Users, Shirt, DollarSign, Fingerprint } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import type { Fraterno } from "@/lib/types"

interface FraternoKardexProps {
  fraternoId: number
}

export function FraternoKardex({ fraternoId }: FraternoKardexProps) {
  const router = useRouter()
  const [fraterno, setFraterno] = useState<Fraterno | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchFraterno()
  }, [fraternoId])

  const fetchFraterno = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/fraternos/${fraternoId}`)
      const data = await response.json()

      if (data.success) {
        setFraterno(data.data)
      }
    } catch (error) {
      console.error("[v0] Error fetching fraterno:", error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <p className="text-muted-foreground">Cargando información...</p>
      </div>
    )
  }

  if (!fraterno) {
    return (
      <div className="flex h-[60vh] flex-col items-center justify-center gap-4">
        <p className="text-muted-foreground">Fraterno no encontrado</p>
        <Link href="/dashboard/fraternos">
          <Button variant="outline">Volver a la lista</Button>
        </Link>
      </div>
    )
  }

  const getEstadoBadge = (estado: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive"> = {
      Activo: "default",
      Inactivo: "secondary",
      Suspendido: "destructive",
    }
    return <Badge variant={variants[estado] || "default"}>{estado}</Badge>
  }

  // CORREGIDO: Convertir a números antes de sumar
  const totalCostos =
    Number(fraterno.monto_tela_traje || 0) + 
    Number(fraterno.monto_tela_pollera || 0) + 
    Number(fraterno.monto_corse || 0)

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/fraternos">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Kardex del Fraterno</h2>
            <p className="text-muted-foreground">Información completa del miembro</p>
          </div>
        </div>
        <Link href={`/dashboard/fraternos/${fraternoId}`}>
          <Button>
            <Edit className="mr-2 h-4 w-4" />
            Editar
          </Button>
        </Link>
      </div>

      {/* Profile Card */}
      <Card className="border-2">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-6">
            {/* Photo Section */}
            <div className="flex flex-col items-center gap-4">
              {fraterno.foto ? (
                <div className="flex flex-col items-center gap-2">
                  <div className="relative w-48 h-48 rounded-lg overflow-hidden border-4 border-primary/20">
                    <Image
                      src={fraterno.foto}
                      alt={fraterno.nombre}
                      fill
                      className="object-cover"
                      onError={(e) => {
                        console.error("Error cargando imagen:", fraterno.foto)
                        e.currentTarget.src = "/placeholder.svg"
                      }}
                    />
                  </div>
                  {/* DEBUG: Mostrar la ruta */}
                  <p className="text-xs text-muted-foreground max-w-48 truncate">
                    Ruta: {fraterno.foto}
                  </p>
                </div>
              ) : (
                <Avatar className="w-48 h-48 border-4 border-primary/20">
                  <AvatarFallback className="text-4xl">
                    {fraterno.nombre
                      .split(" ")
                      .map((n) => n[0])
                      .join("")
                      .slice(0, 2)}
                  </AvatarFallback>
                </Avatar>
              )}
              {getEstadoBadge(fraterno.estado)}
            </div>

            {/* Basic Info */}
            <div className="flex-1 space-y-4">
              <div>
                <h3 className="text-2xl font-bold">{fraterno.nombre}</h3>
                <p className="text-muted-foreground">Miembro de la Fraternidad Morenada Novenantes</p>
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                <div className="flex items-center gap-2">
                  <CreditCard className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">
                    <span className="font-medium">CI:</span> {fraterno.ci}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">
                    <span className="font-medium">Celular:</span> {fraterno.celular}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">
                    <span className="font-medium">Nacimiento:</span>{" "}
                    {new Date(fraterno.fechanacimiento).toLocaleDateString("es-BO")}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">
                    <span className="font-medium">Género:</span> {fraterno.genero}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">
                    <span className="font-medium">Bloque:</span> {fraterno.nombre_bloque || "Sin asignar"}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Fingerprint className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">
                    <span className="font-medium">Huella:</span>{" "}
                    {fraterno.huella_template ? (
                      <span className="text-green-600">Registrada</span>
                    ) : (
                      <span className="text-muted-foreground">No registrada</span>
                    )}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Vestimenta Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shirt className="h-5 w-5" />
              Vestimenta
            </CardTitle>
            <CardDescription>Tallas y medidas del traje de morenada</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-sm text-muted-foreground">Talla Blusa</p>
                <p className="font-medium">{fraterno.talla_blusa || "No especificada"}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Talla Zapato</p>
                <p className="font-medium">{fraterno.talla_zapato || "No especificada"}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Talla Mantilla</p>
                <p className="font-medium">{fraterno.talla_mantilla || "No especificada"}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Corsé</p>
                <p className="font-medium">{fraterno.corse || "No especificado"}</p>
              </div>
            </div>
            <Separator />
            <div className="space-y-2">
              <div>
                <p className="text-sm text-muted-foreground">Tela Traje</p>
                <p className="font-medium">{fraterno.tela_traje || "No especificada"}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Tela Pollera</p>
                <p className="font-medium">{fraterno.tela_pollera || "No especificada"}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Costos Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Costos de Vestimenta
            </CardTitle>
            <CardDescription>Montos asociados al traje</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              {/* CORREGIDO: Usar Number() antes de toFixed() */}
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Tela Traje</span>
                <span className="font-medium">Bs. {Number(fraterno.monto_tela_traje)?.toFixed(2) || "0.00"}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Tela Pollera</span>
                <span className="font-medium">Bs. {Number(fraterno.monto_tela_pollera)?.toFixed(2) || "0.00"}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Corsé</span>
                <span className="font-medium">Bs. {Number(fraterno.monto_corse)?.toFixed(2) || "0.00"}</span>
              </div>
            </div>
            <Separator />
            <div className="flex justify-between items-center rounded-lg bg-primary/10 p-4">
              <span className="font-semibold">Total</span>
              {/* CORREGIDO: Usar Number() en el total */}
              <span className="text-2xl font-bold">Bs. {totalCostos.toFixed(2)}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Additional Info Card */}
      <Card>
        <CardHeader>
          <CardTitle>Información Adicional</CardTitle>
          <CardDescription>Datos de registro y sistema</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <p className="text-sm text-muted-foreground">Fecha de Registro</p>
              <p className="font-medium">
                {new Date(fraterno.created_at).toLocaleDateString("es-BO", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Última Actualización</p>
              <p className="font-medium">
                {new Date(fraterno.updated_at).toLocaleDateString("es-BO", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">ID del Sistema</p>
              <p className="font-medium">#{fraterno.id}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}