"use client"

import { useEffect, useRef } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Camera, Upload, X, Check, Video, VideoOff } from "lucide-react"

interface PhotoCaptureProps {
  value?: string
  onChange: (photoFile: File | null, previewUrl: string) => void
}

export function PhotoCapture({ value, onChange }: PhotoCaptureProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    if (!containerRef.current) return

    let stream: MediaStream | null = null

    const startCamera = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { 
            facingMode: "user", 
            width: { ideal: 1280 },
            height: { ideal: 720 }
          },
          audio: false
        })
        
        if (videoRef.current) {
          videoRef.current.srcObject = stream
        }
        
        // Mostrar vista de cámara y botón capturar
        const cameraView = containerRef.current?.querySelector('.camera-view')
        const initialView = containerRef.current?.querySelector('.initial-view')
        const captureBtn = containerRef.current?.querySelector('.capture-btn')
        
        cameraView?.classList.remove('hidden')
        initialView?.classList.add('hidden')
        captureBtn?.classList.remove('hidden')
        
      } catch (error) {
        console.error('Error accediendo a la cámara:', error)
        alert('No se pudo acceder a la cámara. Verifica los permisos.')
      }
    }

    const stopCamera = () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop())
        stream = null
      }
      
      const cameraView = containerRef.current?.querySelector('.camera-view')
      const initialView = containerRef.current?.querySelector('.initial-view')
      const captureBtn = containerRef.current?.querySelector('.capture-btn')
      const previewContainer = containerRef.current?.querySelector('.preview-container')
      
      cameraView?.classList.add('hidden')
      initialView?.classList.remove('hidden')
      captureBtn?.classList.add('hidden')
      
      // Si no hay foto capturada, mostrar opciones iniciales
      if (!previewContainer?.classList.contains('hidden')) {
        initialView?.classList.add('hidden')
      } else {
        initialView?.classList.remove('hidden')
      }
    }

    const capturePhoto = () => {
      if (videoRef.current && canvasRef.current) {
        const video = videoRef.current
        const canvas = canvasRef.current
        
        canvas.width = video.videoWidth
        canvas.height = video.videoHeight
        
        const ctx = canvas.getContext('2d')
        if (ctx) {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
          
          canvas.toBlob((blob) => {
            if (blob) {
              const file = new File([blob], `foto_camara_${Date.now()}.jpg`, { 
                type: 'image/jpeg'
              })
              
              const previewUrl = URL.createObjectURL(blob)
              
              // Mostrar preview
              const previewImg = containerRef.current?.querySelector('.preview-img') as HTMLImageElement
              const previewContainer = containerRef.current?.querySelector('.preview-container')
              const initialView = containerRef.current?.querySelector('.initial-view')
              const cameraView = containerRef.current?.querySelector('.camera-view')
              
              if (previewImg) previewImg.src = previewUrl
              previewContainer?.classList.remove('hidden')
              initialView?.classList.add('hidden')
              cameraView?.classList.add('hidden')
              
              // Llamar callback de React
              onChange(file, previewUrl)
              
              stopCamera()
            }
          }, 'image/jpeg', 0.8)
        }
      }
    }

    const handleFileUpload = (event: Event) => {
      const input = event.target as HTMLInputElement
      const file = input.files?.[0]
      if (file) {
        const previewUrl = URL.createObjectURL(file)
        const previewImg = containerRef.current?.querySelector('.preview-img') as HTMLImageElement
        const previewContainer = containerRef.current?.querySelector('.preview-container')
        const initialView = containerRef.current?.querySelector('.initial-view')
        
        if (previewImg) previewImg.src = previewUrl
        previewContainer?.classList.remove('hidden')
        initialView?.classList.add('hidden')
        
        onChange(file, previewUrl)
      }
    }

    const removePhoto = () => {
      const previewImg = containerRef.current?.querySelector('.preview-img') as HTMLImageElement
      const previewContainer = containerRef.current?.querySelector('.preview-container')
      const initialView = containerRef.current?.querySelector('.initial-view')
      
      if (previewImg && previewImg.src.startsWith('blob:')) {
        URL.revokeObjectURL(previewImg.src)
      }
      
      previewContainer?.classList.add('hidden')
      initialView?.classList.remove('hidden')
      
      onChange(null, "")
    }

    // Agregar event listeners
    const startCameraBtn = containerRef.current?.querySelector('.start-camera-btn')
    const captureBtn = containerRef.current?.querySelector('.capture-btn')
    const cancelCameraBtn = containerRef.current?.querySelector('.cancel-camera-btn')
    const uploadBtn = containerRef.current?.querySelector('.upload-btn')
    const fileInput = containerRef.current?.querySelector('.file-input')
    const removeBtn = containerRef.current?.querySelector('.remove-btn')

    startCameraBtn?.addEventListener('click', startCamera)
    captureBtn?.addEventListener('click', capturePhoto)
    cancelCameraBtn?.addEventListener('click', stopCamera)
    uploadBtn?.addEventListener('click', () => fileInput?.dispatchEvent(new MouseEvent('click')))
    fileInput?.addEventListener('change', handleFileUpload)
    removeBtn?.addEventListener('click', removePhoto)

    // Cleanup
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop())
      }
      
      startCameraBtn?.removeEventListener('click', startCamera)
      captureBtn?.removeEventListener('click', capturePhoto)
      cancelCameraBtn?.removeEventListener('click', stopCamera)
      uploadBtn?.removeEventListener('click', () => fileInput?.dispatchEvent(new MouseEvent('click')))
      fileInput?.removeEventListener('change', handleFileUpload)
      removeBtn?.removeEventListener('click', removePhoto)
    }
  }, [onChange])

  return (
    <div className="space-y-4" ref={containerRef}>
      <Label>Foto del Fraterno</Label>

      {/* Vista inicial */}
      <div className="initial-view">
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col gap-3">
              <Button 
                type="button" 
                variant="outline" 
                className="w-full bg-transparent h-12 start-camera-btn"
              >
                <Camera className="mr-2 h-4 w-4" />
                Tomar Foto con Cámara
              </Button>
              
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">O</span>
                </div>
              </div>
              
              <Button
                type="button"
                variant="outline"
                className="w-full bg-transparent h-12 upload-btn"
              >
                <Upload className="mr-2 h-4 w-4" />
                Subir Foto desde Archivo
              </Button>
              
              <input 
                type="file" 
                accept="image/*" 
                className="hidden file-input"
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Vista de cámara activa */}
      <div className="camera-view hidden">
        <Card>
          <CardContent className="p-4">
            <div className="space-y-4">
              <div className="relative aspect-video w-full max-w-md mx-auto bg-black rounded-lg overflow-hidden">
                <video 
                  ref={videoRef}
                  autoPlay 
                  playsInline 
                  className="w-full h-full object-cover"
                />
                <div className="absolute bottom-2 left-2 flex items-center gap-2 text-white text-sm">
                  <Video className="h-4 w-4" />
                  <span>Cámara activa</span>
                </div>
              </div>
              
              <div className="flex gap-2 justify-center">
                <Button 
                  type="button" 
                  className="flex-1 max-w-xs bg-green-600 hover:bg-green-700 capture-btn hidden"
                >
                  <Camera className="mr-2 h-4 w-4" />
                  Capturar Foto
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  className="cancel-camera-btn"
                >
                  <VideoOff className="mr-2 h-4 w-4" />
                  Cancelar
                </Button>
              </div>
            </div>
            <canvas ref={canvasRef} className="hidden" />
          </CardContent>
        </Card>
      </div>

      {/* Preview de foto */}
      <div className="preview-container hidden">
        <Card>
          <CardContent className="p-4">
            <div className="relative aspect-square w-full max-w-sm mx-auto">
              <img
                src=""
                alt="Foto del fraterno"
                className="preview-img object-cover rounded-lg w-full h-full"
              />
              <Button
                type="button"
                variant="destructive"
                size="icon"
                className="absolute top-2 right-2 remove-btn"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex items-center justify-center gap-2 mt-4 text-sm text-green-600">
              <Check className="h-4 w-4" />
              <span>Foto lista para subir</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}