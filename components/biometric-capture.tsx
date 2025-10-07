"use client"

import { useState, useRef, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { TabsContent } from "@/components/ui/tabs"
import { Fingerprint, Loader2, Scan, UserCheck, AlertCircle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface BiometricCaptureProps {
  isEdit?: boolean
  fraterno?: any
}

export function BiometricCapture({ isEdit, fraterno }: BiometricCaptureProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [isConnected, setIsConnected] = useState(false)
  const [hasError, setHasError] = useState(false)
  const iframeRef = useRef<HTMLIFrameElement>(null)

  // Comunicación con el iframe
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data.type === 'BIOMETRIC_READY') {
        setIsLoading(false)
        setIsConnected(true)
      }
      if (event.data.type === 'BIOMETRIC_ERROR') {
        setIsLoading(false)
        setHasError(true)
      }
      if (event.data.type === 'CAPTURE_SUCCESS') {
        // Manejar éxito de captura
        console.log('Huella capturada:', event.data)
      }
    }

    window.addEventListener('message', handleMessage)
    return () => window.removeEventListener('message', handleMessage)
  }, [])

  const openInNewWindow = () => {
    window.open('/index.html', 'huella', 'width=1000,height=700')
  }

  return (
    <TabsContent value="biometria" className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Fingerprint className="h-5 w-5" />
            Registro Biométrico
          </CardTitle>
          <CardDescription>
            Sistema de huella dactilar para identificación segura
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          
          {/* Estado: Huella ya registrada */}
          {isEdit && fraterno?.huella_template && (
            <Alert className="bg-green-50 border-green-200">
              <UserCheck className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                Huella biométrica registrada. Puedes actualizarla capturando una nueva.
              </AlertDescription>
            </Alert>
          )}

          {/* Contenedor elegante del sistema de huellas */}
          <div className="rounded-lg border-2 border-dashed border-muted-foreground/25 overflow-hidden bg-gradient-to-br from-background to-muted/20">
            
            {/* Header del sistema */}
            <div className="bg-gradient-to-r from-primary/10 to-primary/5 border-b p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Scan className="h-5 w-5 text-primary" />
                  <h3 className="font-semibold">Sistema de Captura de Huellas</h3>
                </div>
                <div className="flex items-center gap-2">
                  {isConnected && (
                    <div className="flex items-center gap-1 text-sm text-green-600">
                      <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse" />
                      Conectado
                    </div>
                  )}
                  <Button variant="outline" size="sm" onClick={openInNewWindow}>
                    Abrir en ventana nueva
                  </Button>
                </div>
              </div>
            </div>

            {/* Iframe con estados de carga */}
            <div className="relative h-[500px]">
              {isLoading && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/80 z-10">
                  <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
                  <p className="text-sm text-muted-foreground">
                    Inicializando sistema de huellas...
                  </p>
                  <p className="text-xs text-muted-foreground mt-2">
                    Asegúrate de tener el lector conectado
                  </p>
                </div>
              )}

              {hasError && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/80 z-10">
                  <AlertCircle className="h-8 w-8 text-destructive mb-4" />
                  <p className="text-sm font-medium mb-2">Error de conexión</p>
                  <p className="text-xs text-muted-foreground text-center mb-4">
                    No se pudo conectar al sistema de huellas
                  </p>
                  <Button variant="outline" onClick={() => window.location.reload()}>
                    Reintentar
                  </Button>
                </div>
              )}

              <iframe
                ref={iframeRef}
                src="/index.html"
                className="w-full h-full border-0"
                onLoad={() => setIsLoading(false)}
                onError={() => setHasError(true)}
              />
            </div>

            {/* Footer informativo */}
            <div className="bg-muted/30 p-3 border-t">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <div className="flex items-center gap-4">
                  <span>📷 Formato: PNG</span>
                  <span>🔗 Java Agent: localhost:8080</span>
                </div>
                <span>Sistema Biométrico Digital Persona</span>
              </div>
            </div>
          </div>

          {/* Información adicional */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="p-3">
                <div className="font-medium text-blue-800">💾 Guardar Huella</div>
                <div className="text-blue-600 text-xs mt-1">
                  Ingresa el ID del fraterno y haz clic en "GUARDAR (Enrolar)"
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-amber-50 border-amber-200">
              <CardContent className="p-3">
                <div className="font-medium text-amber-800">🔍 Verificar Huella</div>
                <div className="text-amber-600 text-xs mt-1">
                  Compara una huella contra todas las registradas (1:N)
                </div>
              </CardContent>
            </Card>
          </div>

        </CardContent>
      </Card>
    </TabsContent>
  )
}