"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import type { Fraterno, FraternoFormData, Bloque } from "@/lib/types"
import { Fingerprint, Save, ArrowLeft } from "lucide-react"
import Link from "next/link"
import { PhotoCapture } from "./photo-capture"
import { Toaster, toast } from "sonner"
import { BiometricCaptureModern } from "./biometric-capture-modern"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface FraternoFormProps {
  fraterno?: Fraterno
  isEdit?: boolean
}

export function FraternoForm({ fraterno, isEdit = false }: FraternoFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [bloques, setBloques] = useState<Bloque[]>([])
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [photoPreview, setPhotoPreview] = useState<string>(fraterno?.foto || "")
  const [estadoHuella, setEstadoHuella] = useState<any>(null)
  const [fraternoGuardadoId, setFraternoGuardadoId] = useState<number | null>(fraterno?.id || null)
  
  const [formData, setFormData] = useState<FraternoFormData>({
    ci: fraterno?.ci || "",
    fechanacimiento: fraterno?.fechanacimiento || "",
    nombre: fraterno?.nombre || "",
    celular: fraterno?.celular || "",
    foto: fraterno?.foto || "",
    genero: fraterno?.genero || "Masculino",
    bloque_id: fraterno?.bloque_id,
    talla_blusa: fraterno?.talla_blusa || "",
    talla_zapato: fraterno?.talla_zapato || "",
    talla_mantilla: fraterno?.talla_mantilla || "",
    tela_traje: fraterno?.tela_traje || "",
    tela_pollera: fraterno?.tela_pollera || "",
    corse: fraterno?.corse || "",
    monto_tela_traje: fraterno?.monto_tela_traje,
    monto_tela_pollera: fraterno?.monto_tela_pollera,
    monto_corse: fraterno?.monto_corse,
    estado: fraterno?.estado || "Activo",
  })

  useEffect(() => {
    fetchBloques()
  }, [])

  const fetchBloques = async () => {
    try {
      const response = await fetch("/api/bloques")
      const data = await response.json()
      if (data.success) {
        setBloques(data.data)
      }
    } catch (error) {
      console.error("[v0] Error fetching bloques:", error)
    }
  }

  const handlePhotoChange = (file: File | null, previewUrl: string) => {
    setPhotoFile(file)
    setPhotoPreview(previewUrl)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      let fotoPath = formData.foto

      if (photoFile instanceof File) {
        const uploadFormData = new FormData()
        uploadFormData.append('file', photoFile)
        uploadFormData.append('type', 'foto')
        uploadFormData.append('fraternoId', fraterno?.id?.toString() || 'temp')

        const uploadResponse = await fetch('/api/upload', {
          method: 'POST',
          body: uploadFormData,
        })

        const uploadResult = await uploadResponse.json()

        if (!uploadResult.success) {
          toast.error(uploadResult.error || 'Error al subir foto')
          setLoading(false)
          return
        }

        fotoPath = uploadResult.data.path
      }

      const dataToSave = {
        ...formData,
        foto: fotoPath
      }

      const url = isEdit ? `/api/fraternos/${fraterno?.id}` : "/api/fraternos"
      const method = isEdit ? "PUT" : "POST"

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dataToSave),
      })

      if (response.ok) {
        const result = await response.json()
        const nuevoId = result.data?.id || fraterno?.id
        
        // ✅ GUARDAR EL ID PARA USAR EN BIOMETRÍA
        if (nuevoId) {
          setFraternoGuardadoId(nuevoId)
        }

        toast.success(isEdit ? "Fraterno actualizado correctamente" : "Fraterno creado correctamente")
        
        // ✅ EN MODO EDICIÓN, PERMANECER EN EL FORMULARIO PARA PERMITIR ACTUALIZAR HUELLA
        if (!isEdit) {
          router.push("/dashboard/fraternos")
          router.refresh()
        } else {
          // En modo edición, mostrar mensaje pero permanecer en la página
          toast.info("Puede actualizar la huella en la pestaña Biometría")
        }
      } else {
        const errorData = await response.json()
        toast.error(errorData.error || "Error al guardar fraterno")
      }
    } catch (error) {
      console.error("[v0] Error saving fraterno:", error)
      toast.error("Error al guardar fraterno")
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (field: keyof FraternoFormData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  // CORREGIDO: Función para calcular el total convertiendo a números
  const calcularTotal = () => {
    return (
      Number(formData.monto_tela_traje || 0) +
      Number(formData.monto_tela_pollera || 0) +
      Number(formData.monto_corse || 0)
    ).toFixed(2)
  }

  return (
    <>
      <Toaster richColors position="top-right" />
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/dashboard/fraternos">
              <Button type="button" variant="ghost" size="icon">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div>
              <h2 className="text-3xl font-bold tracking-tight">{isEdit ? "Editar Fraterno" : "Nuevo Fraterno"}</h2>
              <p className="text-muted-foreground">
                {isEdit ? "Actualizar información del fraterno" : "Registrar nuevo miembro"}
              </p>
            </div>
          </div>
          <Button type="submit" disabled={loading}>
            <Save className="mr-2 h-4 w-4" />
            {loading ? "Guardando..." : "Guardar"}
          </Button>
        </div>

        {/* ✅ ALERTA DE HUELLA REGISTRADA */}
        {estadoHuella && (
          <Alert className={
            estadoHuella.type === 'error' ? 'bg-red-50 border-red-200' :
            estadoHuella.type === 'registered' ? 'bg-green-50 border-green-200' :
            estadoHuella.type === 'updated' ? 'bg-blue-50 border-blue-200' :
            'bg-blue-50 border-blue-200'
          }>
            <AlertDescription>
              <strong>
                {estadoHuella.type === 'registered' && '✅ '}
                {estadoHuella.type === 'updated' && '🔄 '}
                {estadoHuella.type === 'error' && '❌ '}
              </strong>
              {estadoHuella.message}
              {estadoHuella.fraternoId && ` (ID: ${estadoHuella.fraternoId})`}
            </AlertDescription>
          </Alert>
        )}

        {/* ✅ ALERTA PARA GUARDAR PRIMERO */}
        {!fraternoGuardadoId && !isEdit && (
          <Alert className="bg-amber-50 border-amber-200">
            <AlertDescription className="text-amber-800">
              💡 <strong>Importante:</strong> Guarde primero el formulario para obtener un ID antes de registrar huellas.
            </AlertDescription>
          </Alert>
        )}

        <Tabs defaultValue="personal" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="personal">Datos Personales</TabsTrigger>
            <TabsTrigger value="vestimenta">Vestimenta</TabsTrigger>
            <TabsTrigger value="costos">Costos</TabsTrigger>
            <TabsTrigger value="biometria">Biometría</TabsTrigger>
          </TabsList>

          <TabsContent value="personal" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Información Personal</CardTitle>
                <CardDescription>Datos básicos del fraterno</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <PhotoCapture value={photoPreview} onChange={handlePhotoChange} />

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="nombre">Nombre Completo *</Label>
                    <Input
                      id="nombre"
                      value={formData.nombre}
                      onChange={(e) => handleChange("nombre", e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="ci">Cédula de Identidad *</Label>
                    <Input id="ci" value={formData.ci} onChange={(e) => handleChange("ci", e.target.value)} required />
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="fechanacimiento">Fecha de Nacimiento *</Label>
                    <Input
                      id="fechanacimiento"
                      type="date"
                      value={formData.fechanacimiento}
                      onChange={(e) => handleChange("fechanacimiento", e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="celular">Celular *</Label>
                    <Input
                      id="celular"
                      value={formData.celular}
                      onChange={(e) => handleChange("celular", e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                  <div className="space-y-2">
                    <Label htmlFor="genero">Género *</Label>
                    <Select value={formData.genero} onValueChange={(value) => handleChange("genero", value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Masculino">Masculino</SelectItem>
                        <SelectItem value="Femenino">Femenino</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="bloque_id">Bloque</Label>
                    <Select
                      value={formData.bloque_id?.toString()}
                      onValueChange={(value) => handleChange("bloque_id", Number.parseInt(value))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar bloque" />
                      </SelectTrigger>
                      <SelectContent>
                        {bloques.map((bloque) => (
                          <SelectItem key={bloque.id} value={bloque.id.toString()}>
                            {bloque.nombre_bloque}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="estado">Estado *</Label>
                    <Select value={formData.estado} onValueChange={(value) => handleChange("estado", value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Activo">Activo</SelectItem>
                        <SelectItem value="Inactivo">Inactivo</SelectItem>
                        <SelectItem value="Suspendido">Suspendido</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="vestimenta" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Tallas de Vestimenta</CardTitle>
                <CardDescription>Medidas para el traje de morenada</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="space-y-2">
                    <Label htmlFor="talla_blusa">Talla Blusa</Label>
                    <Input
                      id="talla_blusa"
                      value={formData.talla_blusa}
                      onChange={(e) => handleChange("talla_blusa", e.target.value)}
                      placeholder="Ej: M, L, XL"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="talla_zapato">Talla Zapato</Label>
                    <Input
                      id="talla_zapato"
                      value={formData.talla_zapato}
                      onChange={(e) => handleChange("talla_zapato", e.target.value)}
                      placeholder="Ej: 38, 40, 42"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="talla_mantilla">Talla Mantilla</Label>
                    <Input
                      id="talla_mantilla"
                      value={formData.talla_mantilla}
                      onChange={(e) => handleChange("talla_mantilla", e.target.value)}
                    />
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                  <div className="space-y-2">
                    <Label htmlFor="tela_traje">Tela Traje</Label>
                    <Input
                      id="tela_traje"
                      value={formData.tela_traje}
                      onChange={(e) => handleChange("tela_traje", e.target.value)}
                      placeholder="Tipo de tela"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="tela_pollera">Tela Pollera</Label>
                    <Input
                      id="tela_pollera"
                      value={formData.tela_pollera}
                      onChange={(e) => handleChange("tela_pollera", e.target.value)}
                      placeholder="Tipo de tela"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="corse">Corsé</Label>
                    <Input id="corse" value={formData.corse} onChange={(e) => handleChange("corse", e.target.value)} />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="costos" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Costos de Vestimenta</CardTitle>
                <CardDescription>Montos asociados a la vestimenta</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="space-y-2">
                    <Label htmlFor="monto_tela_traje">Monto Tela Traje (Bs.)</Label>
                    <Input
                      id="monto_tela_traje"
                      type="number"
                      step="0.01"
                      value={formData.monto_tela_traje || ""}
                      onChange={(e) => handleChange("monto_tela_traje", e.target.value === "" ? null : Number(e.target.value))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="monto_tela_pollera">Monto Tela Pollera (Bs.)</Label>
                    <Input
                      id="monto_tela_pollera"
                      type="number"
                      step="0.01"
                      value={formData.monto_tela_pollera || ""}
                      onChange={(e) => handleChange("monto_tela_pollera", e.target.value === "" ? null : Number(e.target.value))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="monto_corse">Monto Corsé (Bs.)</Label>
                    <Input
                      id="monto_corse"
                      type="number"
                      step="0.01"
                      value={formData.monto_corse || ""}
                      onChange={(e) => handleChange("monto_corse", e.target.value === "" ? null : Number(e.target.value))}
                    />
                  </div>
                </div>

                <div className="rounded-lg border bg-muted/50 p-4">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Total Estimado:</span>
                    {/* CORREGIDO: Usar la función que convierte a números */}
                    <span className="text-2xl font-bold">Bs. {calcularTotal()}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="biometria" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Registro Biométrico</CardTitle>
                <CardDescription>
                  {fraternoGuardadoId 
                    ? `Huella dactilar para identificación (ID: ${fraternoGuardadoId})`
                    : "Guarde primero el formulario para registrar huellas"
                  }
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-col items-center justify-center gap-4 rounded-lg border-2 border-dashed p-8">
                  <Fingerprint className="h-16 w-16 text-muted-foreground" />
                  <div className="text-center">
                    <p className="font-medium">
                      {isEdit && fraterno?.huella_template ? "Huella registrada" : "No hay huella registrada"}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Sistema integrado con Digital Persona y servicio Java AFIS
                    </p>
                  </div>
                  
                  {/* ✅ COMPONENTE DE BIOMETRÍA MEJORADO */}
                  <BiometricCaptureModern 
                    isEdit={isEdit} 
                    fraterno={fraterno} 
                    currentFraternoId={fraternoGuardadoId || fraterno?.id} 
                    onHuellaStatusChange={(status) => {
                      setEstadoHuella(status)
                      if (status.type === 'registered' || status.type === 'updated') {
                        toast.success("Huella registrada exitosamente en AFIS")
                      }
                      if (status.type === 'error') {
                        toast.error("Error al registrar huella: " + status.message)
                      }
                    }}
                    modo="integrado"
                  />
                </div>

                {/* ✅ INSTRUCCIONES PARA EL USUARIO */}
                {!fraternoGuardadoId && !isEdit && (
                  <Alert className="bg-amber-50 border-amber-200">
                    <AlertDescription className="text-amber-800">
                      <strong>Instrucciones:</strong>
                      <ol className="list-decimal list-inside mt-2 space-y-1">
                        <li>Complete los datos personales y guarde el formulario</li>
                        <li>Vuelva a esta pestaña para registrar la huella</li>
                        <li>Capture la huella y haga click en "GUARDAR (Enrolar)"</li>
                      </ol>
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </form>
    </>
  )
}