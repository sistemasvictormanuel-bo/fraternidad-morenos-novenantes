"use client"

import { BiometricCaptureModern } from "@/components/biometric-capture-modern"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs" // ← IMPORTAR TODOS
import { Fingerprint, User } from "lucide-react"
import { useState } from "react"

export default function VerificarHuellaPage() {
  const [resultadoVerificacion, setResultadoVerificacion] = useState<{
    fraternoId?: number
    nombre?: string
    success: boolean
    message: string
  } | null>(null)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <Fingerprint className="h-8 w-8" />
          Verificación de Huella
        </h1>
        <p className="text-muted-foreground">
          Sistema de identificación biométrica 1:N
        </p>
      </div>

      {/* Resultado de Verificación */}
      {resultadoVerificacion && (
        <Card className={
          resultadoVerificacion.success 
            ? "bg-green-50 border-green-200" 
            : "bg-amber-50 border-amber-200"
        }>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              {resultadoVerificacion.success ? (
                <>
                  <User className="h-8 w-8 text-green-600" />
                  <div>
                    <h3 className="font-semibold text-green-800">✅ Coincidencia Encontrada</h3>
                    <p className="text-green-700">
                      Fraterno ID: <strong>{resultadoVerificacion.fraternoId}</strong>
                    </p>
                    {resultadoVerificacion.nombre && (
                      <p className="text-green-700">
                        Nombre: <strong>{resultadoVerificacion.nombre}</strong>
                      </p>
                    )}
                  </div>
                </>
              ) : (
                <>
                  <User className="h-8 w-8 text-amber-600" />
                  <div>
                    <h3 className="font-semibold text-amber-800">❌ No se encontró coincidencia</h3>
                    <p className="text-amber-700">{resultadoVerificacion.message}</p>
                  </div>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* ✅ ENVOLVER EN TABS COMPLETO (igual que en formsfraterno) */}
      <Tabs defaultValue="biometria" className="w-full">
        <TabsList className="grid w-full grid-cols-1"> 
          {/* Solo un tab para que se vea igual */}
          <TabsTrigger value="biometria">Verificación de Huella</TabsTrigger>
        </TabsList>
        
        <TabsContent value="biometria" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Fingerprint className="h-5 w-5" />
                Capturar Huella para Verificación
              </CardTitle>
              <CardDescription>
                Capture una huella para buscar coincidencias en la base de datos
              </CardDescription>
            </CardHeader>
            <CardContent>
              <BiometricCaptureModern 
                modo="verificacion"
                onHuellaStatusChange={(status) => {
                  if (status.type === 'registered' || status.type === 'updated') {
                    setResultadoVerificacion({
                      success: true,
                      fraternoId: status.fraternoId,
                      message: status.message,
                      nombre: `Fraterno ${status.fraternoId}`
                    })
                  } else if (status.type === 'error') {
                    setResultadoVerificacion({
                      success: false,
                      message: status.message
                    })
                  }
                }}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}