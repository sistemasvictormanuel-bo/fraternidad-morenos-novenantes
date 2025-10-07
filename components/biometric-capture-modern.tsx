"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { TabsContent } from "@/components/ui/tabs"
import { Fingerprint, RefreshCw, Info, Camera, Download, Scan, UserCheck, Loader2 } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

// Declarar globales para TypeScript
declare global {
  interface Window {
    toggle_visibility: (ids: string[]) => void
    setActive: (element1: string, element2: string) => void
    onStart: () => void
    onStop: () => void
    onClear: () => void
    onGetInfo: () => void
    onImageDownload: () => void
    readersDropDownPopulate: (checkForRedirecting: boolean) => void
    populatePopUpModal: () => void
    selectChangeEvent: () => void
    checkOnly: (element: HTMLInputElement) => void
    test: any
    myVal: string
    $: any
    jQuery: any
    Fingerprint: {
      SampleFormat: {
        PngImage: any
        Raw: any
        Compressed: any
        Intermediate: any
      }
      QualityCode: any
      b64UrlTo64: (str: string) => string
      b64UrlToUtf8: (str: string) => string
    }
    FingerprintSdkTest: any
    AGENT_BASE_URL?: string
    currentFormat?: any
    assignFormat?: () => void
    enrolarHuella: (fraternoId: string, imageBase64: string) => Promise<void>
    verificarHuella: (imageBase64: string) => Promise<void>
  }
}

interface BiometricCaptureModernProps {
  isEdit?: boolean
  fraterno?: any
  currentFraternoId?: number
  onHuellaStatusChange?: (status: {
    type: 'registered' | 'updated' | 'removed' | 'error' | 'verified' // ← AGREGAR 'verified'
    message: string
    fraternoId?: number
    timestamp?: Date
  }) => void
  modo?: 'independiente' | 'integrado' | 'verificacion' // ← NUEVO MODO
}
export function BiometricCaptureModern({ 
  isEdit, 
  fraterno, 
  currentFraternoId,
  onHuellaStatusChange,
  modo = 'integrado'
}: BiometricCaptureModernProps) {
  const [activeTab, setActiveTab] = useState<"reader" | "capture">("reader")
  const [isSDKLoaded, setIsSDKLoaded] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [scriptsLoaded, setScriptsLoaded] = useState(0)
  const [loadingMessage, setLoadingMessage] = useState("Cargando sistema de huellas...")
  const [estadoHuella, setEstadoHuella] = useState<'disponible' | 'capturando' | 'enrolando' | 'verificando'>('disponible')
  const [huellaRegistrada, setHuellaRegistrada] = useState(!!fraterno?.huella_registrada)
  
  const totalScripts = 6
  const scriptsLoadedRef = useRef(0)
  const initializationAttempts = useRef(0)

  // ✅ CONFIGURACIÓN POR MODO
const mostrarBotonesEnrolar = modo !== 'verificacion'
const mostrarInputID = modo === 'integrado'
const tituloPorModo = {
  integrado: 'Sistema de Huella Dactilar - Digital Persona',
  independiente: 'Sistema de Huella Dactilar - Modo Independiente', 
  verificacion: 'Sistema de Verificación de Huellas' // ← NUEVO
}

  // ✅ FUNCIÓN PARA PREVENIR SUBMIT DEL FORMULARIO
  const preventSubmit = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }

  // ✅ CREAR TODOS LOS ELEMENTOS QUE APP.JS NECESITA
  const createMissingElements = () => {
    const elementsToCreate = [
      { id: 'content-capture', display: 'none' },
      { id: 'content-reader', display: 'block' },
      { id: 'Scores', display: 'block' },
      { id: 'Reader', display: 'none' },
      { id: 'Capture', display: 'none' },
      { id: 'status', display: 'block' },
      { id: 'imagediv', display: 'block' },
      { id: 'imageGallery', display: 'block' },
      { id: 'deviceInfo', display: 'block' },
    ]

    elementsToCreate.forEach(({ id, display }) => {
      if (!document.getElementById(id)) {
        const element = document.createElement('div')
        element.id = id
        element.style.display = display
        document.body.appendChild(element)
        console.log(`✅ Creado elemento: ${id}`)
      }
    })

    // ✅ CREAR BOTONES QUE APP.JS BUSCA
    const buttonsToCreate = [
      { id: 'clearButton', value: 'Clear' },
      { id: 'save', value: 'GUARDAR (Enrolar)' },
      { id: 'verifyButton', value: 'VERIFICAR' },
      { id: 'start', value: 'Start' },
      { id: 'stop', value: 'Stop' },
      { id: 'info', value: 'Info' },
      { id: 'refreshList', value: 'Refresh List' },
      { id: 'capabilities', value: 'Capabilities' },
      { id: 'saveImagePng', value: 'Export' },
    ]

    buttonsToCreate.forEach(({ id, value }) => {
      if (!document.getElementById(id)) {
        const button = document.createElement('button')
        button.id = id
        button.textContent = value
        button.style.display = 'none'
        document.body.appendChild(button)
        console.log(`✅ Creado botón: ${id}`)
      }
    })

    // ✅ CREAR EL FORM myForm CON TODOS LOS CHECKBOXES
    if (!(document.forms as any)['myForm']) {
      const form = document.createElement('form')
      form.name = 'myForm'
      form.style.display = 'none'
      document.body.appendChild(form)
      
      // Agregar checkboxes al form
      const formats = [
        { name: 'Raw', value: '1', checked: false },
        { name: 'Intermediate', value: '2', checked: false },
        { name: 'Compressed', value: '3', checked: false },
        { name: 'PngImage', value: '4', checked: true }
      ]
      
      formats.forEach(format => {
        const checkbox = document.createElement('input')
        checkbox.type = 'checkbox'
        checkbox.name = format.name
        checkbox.value = format.value
        checkbox.checked = format.checked
        checkbox.onclick = function() { 
          if (window.checkOnly) window.checkOnly(this) 
        }
        form.appendChild(checkbox)
        
        const label = document.createElement('label')
        label.textContent = format.name
        form.appendChild(label)
        form.appendChild(document.createElement('br'))
      })
      
      console.log('✅ Creado formulario myForm con checkboxes')
    }

    // ✅ CREAR SELECT readersDropDown
    if (!document.getElementById('readersDropDown')) {
      const select = document.createElement('select')
      select.id = 'readersDropDown'
      select.className = 'form-control'
      select.onchange = function() { 
        if (window.selectChangeEvent) window.selectChangeEvent() 
      }
      document.body.appendChild(select)
      console.log('✅ Creado select readersDropDown')
    }

    // ✅ CREAR INPUT qualityInputBox
    if (!document.getElementById('qualityInputBox')) {
      const input = document.createElement('input')
      input.id = 'qualityInputBox'
      input.type = 'text'
      input.size = 20
      input.style.backgroundColor = '#DCDCDC'
      input.style.textAlign = 'center'
      input.readOnly = true
      document.body.appendChild(input)
      console.log('✅ Creado input qualityInputBox')
    }
  }

  // ✅ SOBRESCRIBIR FUNCIONES PROBLEMÁTICAS DE APP.JS
  const overrideProblematicFunctions = () => {
    // ✅ SOBRESCRIBIR setActive PARA EVITAR ERRORES
    window.setActive = (element1: string, element2: string) => {
      console.log(`🔧 setActive sobrescrito: ${element1}, ${element2}`)
      // Solo cambiar el estado de React, no manipular DOM
      setActiveTab(element1 === "Capture" ? "capture" : "reader")
    }

    // ✅ SOBRESCRIBIR assignFormat PARA EVITAR ERRORES
    window.assignFormat = () => {
      console.log("🔧 assignFormat sobrescrito - usando PNG por defecto")
      // Siempre usar PNG como formato por defecto
      if (window.Fingerprint && window.Fingerprint.SampleFormat) {
        window.currentFormat = window.Fingerprint.SampleFormat.PngImage
      }
      return window.currentFormat
    }

    // ✅ INICIALIZAR currentFormat
    if (window.Fingerprint && window.Fingerprint.SampleFormat) {
      window.currentFormat = window.Fingerprint.SampleFormat.PngImage
    }
  }

  // ✅ FUNCIÓN MEJORADA DE ENROLAMIENTO
  const handleEnrollar = async (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault()
      e.stopPropagation()
    }
    
    // 🔄 DIFERENTES FLUJOS SEGÚN MODO
    if (modo === 'integrado' && !currentFraternoId) {
      alert("⚠️ Primero debe guardar el formulario para obtener un ID de fraterno")
      onHuellaStatusChange?.({
        type: 'error',
        message: 'No hay ID de fraterno disponible'
      })
      return
    }

    const imageBase64 = localStorage.getItem("imageSrc")
    if (!imageBase64) {
      alert("❌ Primero capture una huella válida")
      return
    }

    setEstadoHuella('enrolando')
    
    try {
      console.log("🎯 Iniciando enrolamiento...")
      
      // ✅ USAR EL ID CORRECTO
      const idAUsar = currentFraternoId

      if (!idAUsar) {
        throw new Error("No se pudo determinar el ID del fraterno")
      }

      // Llamar a la función de enrolamiento
      if (window.enrolarHuella) {
        await window.enrolarHuella(idAUsar.toString(), imageBase64)
        
        // ✅ NOTIFICAR ÉXITO
        setHuellaRegistrada(true)
        onHuellaStatusChange?.({
          type: isEdit ? 'updated' : 'registered',
          message: 'Huella registrada exitosamente en sistema AFIS',
          fraternoId: idAUsar,
          timestamp: new Date()
        })
        
        // ✅ LIMPIAR DESPUÉS DE ENROLAR
        setTimeout(() => {
          onClear()
          setEstadoHuella('disponible')
        }, 1000)
        
      } else {
        throw new Error("Función de enrolamiento no disponible")
      }
      
    } catch (error) {
      console.error("❌ Error en enrolamiento:", error)
      setEstadoHuella('disponible')
      onHuellaStatusChange?.({
        type: 'error',
        message: error instanceof Error ? error.message : 'Error desconocido'
      })
    }
  }

  // ✅ FUNCIÓN PARA VERIFICAR
  const handleVerificar = async (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault()
      e.stopPropagation()
    }

    const imageBase64 = localStorage.getItem("imageSrc")
    if (!imageBase64) {
      alert("❌ Primero capture una huella para verificar")
      return
    }

    setEstadoHuella('verificando')
    
    try {
      if (window.verificarHuella) {
        await window.verificarHuella(imageBase64)
        // La alerta viene de app.js
      } else {
        throw new Error("Función de verificación no disponible")
      }
    } catch (error) {
      console.error("Error en verificación:", error)
    } finally {
      setEstadoHuella('disponible')
    }
  }

  // Función para cargar scripts dinámicamente
  const loadScript = (src: string, onLoad: () => void) => {
    const existingScript = Array.from(document.scripts).find(script => script.src.includes(src))
    if (existingScript) {
      console.log(`Script ${src} ya está cargado, omitiendo...`)
      onLoad()
      return
    }

    const script = document.createElement('script')
    script.src = src
    script.onload = onLoad
    script.onerror = () => {
      console.error(`Error cargando script: ${src}`)
      onLoad()
    }
    document.head.appendChild(script)
  }

  // Cargar todos los scripts cuando el componente se monta
  useEffect(() => {
    const loadAllScripts = () => {
      const scripts = [
        { src: "https://code.jquery.com/jquery-3.6.0.min.js", name: "jQuery" },
        { src: "https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js", name: "Bootstrap" },
        { src: "/scripts/es6-shim.js", name: "ES6 Shim" },
        { src: "/scripts/websdk.client.bundle.min.js", name: "WebSDK" },
        { src: "/scripts/fingerprint.sdk.min.js", name: "Fingerprint SDK" },
        { src: "/scripts/app.js", name: "App JS" }
      ]

      scripts.forEach((script, index) => {
        setTimeout(() => {
          if (script.name === "App JS" && window.AGENT_BASE_URL) {
            console.log('app.js ya está cargado, omitiendo...')
            scriptsLoadedRef.current += 1
            setScriptsLoaded(scriptsLoadedRef.current)
            if (scriptsLoadedRef.current === totalScripts) {
              initializeSDK()
            }
            return
          }

          setLoadingMessage(`Cargando ${script.name}...`)
          loadScript(script.src, () => {
            scriptsLoadedRef.current += 1
            setScriptsLoaded(scriptsLoadedRef.current)
            console.log(`✅ ${script.name} cargado`)
            
            if (scriptsLoadedRef.current === totalScripts) {
              initializeSDK()
            }
          })
        }, index * 300)
      })
    }

    const initializeSDK = () => {
      setLoadingMessage("Inicializando SDK...")
      console.log("🔄 Iniciando inicialización del SDK...")
      
      const checkSDK = () => {
        initializationAttempts.current += 1
        
        const dependenciesLoaded = window.$ && window.Fingerprint && window.FingerprintSdkTest
        
        console.log(`🔍 Intento ${initializationAttempts.current} - Dependencias:`, {
          jQuery: !!window.$,
          Fingerprint: !!window.Fingerprint,
          FingerprintSdkTest: !!window.FingerprintSdkTest,
          test: !!window.test,
          readersDropDownPopulate: 'readersDropDownPopulate' in window
        })

        if (dependenciesLoaded) {
          try {
            // ✅ CREAR TODOS LOS ELEMENTOS FALTANTES
            createMissingElements()
            
            // ✅ SOBRESCRIBIR FUNCIONES PROBLEMÁTICAS
            overrideProblematicFunctions()

            // ✅ INICIALIZAR SDK
            if (!window.test && window.FingerprintSdkTest) {
              console.log("🔄 Creando nueva instancia de test...")
              window.test = new window.FingerprintSdkTest()
              
              // ✅ SIMULAR window.onload DE APP.JS
              setTimeout(() => {
                if (window.readersDropDownPopulate) {
                  console.log("🔄 Ejecutando readersDropDownPopulate...")
                  window.readersDropDownPopulate(true)
                }
              }, 500)
            }

            if (window.test && 'readersDropDownPopulate' in window) {
              console.log("✅ SDK inicializado correctamente!")
              
              setIsSDKLoaded(true)
              setLoadingMessage("")
              
            } else {
              throw new Error("SDK no se inicializó correctamente")
            }
          } catch (error) {
            console.error("❌ Error en inicialización:", error)
            if (initializationAttempts.current < 10) {
              setTimeout(checkSDK, 1000)
            } else {
              setLoadingMessage("Error: No se pudo inicializar el SDK")
            }
          }
        } else {
          if (initializationAttempts.current < 15) {
            console.log(`⏳ Esperando dependencias... (${initializationAttempts.current}/15)`)
            setTimeout(checkSDK, 1000)
          } else {
            console.error("❌ Timeout: No se cargaron todas las dependencias")
            setLoadingMessage("Error: Timeout en carga del SDK")
          }
        }
      }
      
      setTimeout(checkSDK, 1000)
    }

    if (window.test && 'readersDropDownPopulate' in window) {
      console.log("✅ SDK ya está cargado, omitiendo carga...")
      createMissingElements()
      overrideProblematicFunctions()
      setIsSDKLoaded(true)
      setLoadingMessage("")
    } else if (window.AGENT_BASE_URL && window.$ && window.Fingerprint) {
      console.log("🔄 Scripts cargados, inicializando SDK...")
      initializeSDK()
    } else {
      console.log("🔄 Cargando scripts desde cero...")
      loadAllScripts()
    }

    return () => {
      console.log("🧹 Cleanup del componente de huellas")
    }
  }, [currentFraternoId])

  // ✅ FUNCIONES WRAPPER MEJORADAS
  const handleToggleVisibility = (ids: string[]) => {
    if ('toggle_visibility' in window && typeof window.toggle_visibility === 'function') {
      window.toggle_visibility(ids)
    }
    setActiveTab(ids[0] === "content-capture" ? "capture" : "reader")
  }

  const handleSetActive = (element1: string, element2: string) => {
    setActiveTab(element1 === "Capture" ? "capture" : "reader")
  }

  // ✅ FUNCIONES QUE LLAMAN DIRECTAMENTE A APP.JS
  const onStart = (e?: React.MouseEvent) => {
    if (e) preventSubmit(e)
    console.log("🎬 Ejecutando onStart...")
    
    // ✅ FORZAR assignFormat ANTES DE START
    if (window.assignFormat) {
      window.assignFormat()
    }
    
    if ('onStart' in window && typeof window.onStart === 'function') {
      window.onStart()
    } else {
      console.error("❌ onStart no disponible en window")
    }
  }
  
  const onStop = (e?: React.MouseEvent) => {
    if (e) preventSubmit(e)
    console.log("⏹️ Ejecutando onStop...")
    if ('onStop' in window && typeof window.onStop === 'function') {
      window.onStop()
    }
  }
  
  const onClear = (e?: React.MouseEvent) => {
    if (e) preventSubmit(e)
    console.log("🧹 Ejecutando onClear...")
    if ('onClear' in window && typeof window.onClear === 'function') {
      window.onClear()
    }
  }
  
  const onGetInfo = (e?: React.MouseEvent) => {
    if (e) preventSubmit(e)
    console.log("ℹ️ Ejecutando onGetInfo...")
    if ('onGetInfo' in window && typeof window.onGetInfo === 'function') {
      window.onGetInfo()
    }
  }
  
  const onImageDownload = (e?: React.MouseEvent) => {
    if (e) preventSubmit(e)
    console.log("📥 Ejecutando onImageDownload...")
    if ('onImageDownload' in window && typeof window.onImageDownload === 'function') {
      window.onImageDownload()
    }
  }
  
  const readersDropDownPopulate = (check: boolean, e?: React.MouseEvent) => {
    if (e) preventSubmit(e)
    console.log("🔄 Ejecutando readersDropDownPopulate...")
    if ('readersDropDownPopulate' in window && typeof window.readersDropDownPopulate === 'function') {
      window.readersDropDownPopulate(check)
    }
  }
  
  const populatePopUpModal = (e?: React.MouseEvent) => {
    if (e) preventSubmit(e)
    console.log("ℹ️ Abriendo modal de capacidades...")
    if ('populatePopUpModal' in window && typeof window.populatePopUpModal === 'function') {
      window.populatePopUpModal()
      setShowModal(true)
    }
  }
  
  const selectChangeEvent = () => {
    console.log("🔀 Ejecutando selectChangeEvent...")
    if ('selectChangeEvent' in window && typeof window.selectChangeEvent === 'function') {
      window.selectChangeEvent()
    }
  }
  
  const checkOnly = (element: HTMLInputElement) => {
    console.log("✅ Ejecutando checkOnly...")
    if ('checkOnly' in window && typeof window.checkOnly === 'function') {
      window.checkOnly(element)
    }
  }

  // Estado de carga
  if (!isSDKLoaded) {
    return (
      <TabsContent value="biometria" className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Fingerprint className="h-5 w-5" />
              Sistema de Huella Dactilar
            </CardTitle>
            <CardDescription>
              {loadingMessage}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center p-8 space-y-4">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <div className="text-center">
                <p className="font-medium">{loadingMessage}</p>
                <p className="text-sm text-muted-foreground mt-2">
                  {scriptsLoaded}/{totalScripts} scripts cargados
                  {initializationAttempts.current > 0 && ` • Intento ${initializationAttempts.current}`}
                </p>
                <div className="w-full bg-muted rounded-full h-2 mt-2">
                  <div 
                    className="bg-primary h-2 rounded-full transition-all duration-300"
                    style={{ width: `${(scriptsLoaded / totalScripts) * 100}%` }}
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </TabsContent>
    )
  }

  return (
    <TabsContent value="biometria" className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Fingerprint className="h-5 w-5" />
            Sistema de Huella Dactilar - Digital Persona
            {currentFraternoId && (
              <span className="text-sm font-normal text-muted-foreground ml-2">
                (ID: {currentFraternoId})
              </span>
            )}
          </CardTitle>
          <CardDescription>
            {modo === 'integrado' 
              ? '✅ Integrado con formulario - Use después de guardar'
              : '🔧 Modo independiente - Puede usar sin formulario'
            }
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          
          {/* ✅ ESTADO DE HUELLA REGISTRADA */}
          {huellaRegistrada && (
            <Alert className="bg-green-50 border-green-200">
              <UserCheck className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                Huella biométrica registrada en AFIS
              </AlertDescription>
            </Alert>
          )}

          {/* ✅ INDICADOR DE ESTADO ACTUAL */}
          {estadoHuella !== 'disponible' && (
            <Alert className="bg-blue-50 border-blue-200">
              <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
              <AlertDescription className="text-blue-800">
                {estadoHuella === 'enrolando' && 'Registrando huella en AFIS...'}
                {estadoHuella === 'verificando' && 'Verificando huella...'}
                {estadoHuella === 'capturando' && 'Capturando huella...'}
              </AlertDescription>
            </Alert>
          )}

          {/* Navigation Tabs */}
          <div className="flex border-b">
            <button
              className={`flex items-center gap-2 px-4 py-2 font-medium ${
                activeTab === "reader" 
                  ? "border-b-2 border-primary text-primary" 
                  : "text-muted-foreground hover:text-foreground"
              }`}
              onClick={(e) => {
                preventSubmit(e)
                handleToggleVisibility(['content-reader', 'content-capture'])
                handleSetActive('Reader', 'Capture')
              }}
            >
              <Scan className="h-4 w-4" />
              Reader
            </button>
            <button
              className={`flex items-center gap-2 px-4 py-2 font-medium ${
                activeTab === "capture" 
                  ? "border-b-2 border-primary text-primary" 
                  : "text-muted-foreground hover:text-foreground"
              }`}
              onClick={(e) => {
                preventSubmit(e)
                handleToggleVisibility(['content-capture', 'content-reader'])
                handleSetActive('Capture', 'Reader')
              }}
            >
              <Camera className="h-4 w-4" />
              Capture
            </button>
          </div>

          {/* Scan Quality Indicator */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <span className="font-medium">Scan Quality:</span>
                <input 
                  type="text" 
                  id="qualityInputBox"
                  className="flex-1 max-w-[200px] bg-muted px-3 py-2 rounded border text-center font-mono"
                  readOnly 
                  placeholder="--"
                />
              </div>
            </CardContent>
          </Card>

          {/* Reader Tab */}
          {activeTab === "reader" && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Select Reader:</label>
                <select 
                  className="w-full p-3 border rounded-lg bg-background focus:ring-2 focus:ring-primary focus:border-transparent"
                  id="readersDropDown" 
                  onChange={selectChangeEvent}
                >
                  <option value="">Select Reader</option>
                </select>
              </div>
              
              <div className="flex gap-3">
                <Button 
                  variant="outline" 
                  onClick={(e) => readersDropDownPopulate(false, e)}
                  className="flex items-center gap-2"
                  type="button"
                >
                  <RefreshCw className="h-4 w-4" />
                  Refresh List
                </Button>
                <Button 
                  variant="outline" 
                  onClick={populatePopUpModal}
                  className="flex items-center gap-2"
                  type="button"
                >
                  <Info className="h-4 w-4" />
                  Capabilities
                </Button>
              </div>

              <div id="deviceInfo" className="mt-4 p-4 bg-muted/30 rounded-lg"></div>
            </div>
          )}

          {/* Capture Tab */}
          {activeTab === "capture" && (
            <div className="space-y-6">
              {/* Status */}
              <div id="status" className="text-center p-3 bg-blue-50 rounded-lg"></div>

              {/* Image Display */}
              <Card>
                <CardContent className="p-4">
                  <div id="imagediv" className="flex justify-center min-h-[200px] items-center">
                    <div className="text-muted-foreground text-center">
                      <Camera className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p>La imagen de la huella aparecerá aquí</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Control Buttons */}
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                <Button 
                  variant="outline" 
                  onClick={onClear} 
                  className="h-11" 
                  type="button"
                  disabled={estadoHuella !== 'disponible'}
                >
                  Clear
                </Button>
                
                <Button 
                  onClick={handleEnrollar}
                  disabled={estadoHuella !== 'disponible'}
                  className="h-11 bg-green-600 hover:bg-green-700"
                  type="button"
                >
                  {estadoHuella === 'enrolando' ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : null}
                  GUARDAR (Enrolar)
                </Button>
                
                <Button 
                  onClick={handleVerificar}
                  disabled={estadoHuella !== 'disponible'}
                  className="h-11 bg-amber-500 hover:bg-amber-600"
                  type="button"
                >
                  {estadoHuella === 'verificando' ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : null}
                  VERIFICAR
                </Button>
                
                <Button 
                  variant="default" 
                  onClick={onStart} 
                  className="h-11" 
                  type="button"
                  disabled={estadoHuella !== 'disponible'}
                >
                  Start
                </Button>
                
                <Button 
                  variant="default" 
                  onClick={onStop} 
                  className="h-11" 
                  type="button"
                  disabled={estadoHuella !== 'disponible'}
                >
                  Stop
                </Button>
                
                <Button 
                  variant="outline" 
                  onClick={onGetInfo} 
                  className="h-11" 
                  type="button"
                  disabled={estadoHuella !== 'disponible'}
                >
                  Info
                </Button>
              </div>

              {/* Format Options */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Acquire Formats</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    {[
                      { name: "Raw", value: "1", title: "Will save data to a .raw file." },
                      { name: "Intermediate", value: "2", title: "Will save data to a Intermediate file" },
                      { name: "Compressed", value: "3", title: "Will save data to a .wsq file." },
                      { name: "PngImage", value: "4", title: "Will save data to a .png file.", checked: true }
                    ].map((format) => (
                      <div key={format.name} className="flex items-center space-x-3 p-2 hover:bg-muted/30 rounded">
                        <input
                          type="checkbox"
                          id={`format-${format.name}`}
                          name={format.name}
                          value={format.value}
                          defaultChecked={format.checked}
                          onChange={(e) => checkOnly(e.target as HTMLInputElement)}
                          className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                        />
                        <label 
                          htmlFor={`format-${format.name}`}
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                          title={format.title}
                        >
                          {format.name}
                        </label>
                      </div>
                    ))}
                  </div>
                  <Button 
                    variant="outline" 
                    onClick={onImageDownload} 
                    className="w-full flex items-center gap-2"
                    type="button"
                  >
                    <Download className="h-4 w-4" />
                    Export
                  </Button>
                </CardContent>
              </Card>

              <div id="imageGallery" className="grid grid-cols-2 md:grid-cols-4 gap-2"></div>
            </div>
          )}

          {/* Modal para Capabilities */}
          {showModal && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
              <div className="bg-background rounded-lg shadow-lg max-w-md w-full mx-4">
                <div className="flex items-center justify-between p-4 border-b">
                  <h3 className="text-lg font-semibold">Reader Information</h3>
                  <button 
                    onClick={() => setShowModal(false)}
                    className="text-muted-foreground hover:text-foreground text-xl"
                  >
                    ×
                  </button>
                </div>
                <div className="p-4 max-h-96 overflow-y-auto">
                  <div id="ReaderInformationFromDropDown"></div>
                </div>
                <div className="flex justify-end p-4 border-t">
                  <Button onClick={() => setShowModal(false)} type="button">
                    Close
                  </Button>
                </div>
              </div>
            </div>
          )}

        </CardContent>
      </Card>
    </TabsContent>
  )
}