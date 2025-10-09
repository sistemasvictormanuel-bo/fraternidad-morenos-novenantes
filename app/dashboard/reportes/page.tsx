"use client"
//por implmentar y subir 

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Download, Users, Shirt, Fingerprint, BarChart3, PieChart, FileText } from "lucide-react"

export default function ReportesPage() {
  const [exporting, setExporting] = useState<string | null>(null)
  const [showDropdown, setShowDropdown] = useState(false)

  const handleExportPDF = async (tipo: string) => {
    try {
      setExporting(tipo)
      setShowDropdown(false)
      
      // ✅ USA LOS DATOS QUE YA TIENES EN dashboard/stats
      let endpoint = ''
      
      // MAPEAR A TUS CONSULTAS EXISTENTES
      const endpointMap = {
        'fraternos-genero': '/api/reportes/fraternos-genero', // ← YA EXISTE
        'fraternos-bloques': '/api/reportes/fraternos-bloques',  // ← YA EXISTE
        'estadisticas-generales': '/api/reportes/estadisticas-generales',// ← YA EXISTE
        'sin-huella': '/api/reportes/sin-huella', // ← CREAR ESTE
        'tallas-ropa': '/api/reportes/tallas-ropa', // ← CREAR ESTE
        'tallas-vestimenta': '/api/reportes/tallas-vestimenta' // ← CREAR ESTE
      }
      
      endpoint = endpointMap[tipo as keyof typeof endpointMap] || `/api/reportes/${tipo}`
      
      const response = await fetch(endpoint)
      
      if (!response.ok) {
        throw new Error('Error al generar el reporte')
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      
      const nombresArchivos = {
        'fraternos-genero': `distribucion-genero-${new Date().toISOString().split('T')[0]}.pdf`,
        'fraternos-bloques': `fraternos-por-bloque-${new Date().toISOString().split('T')[0]}.pdf`,
        'estadisticas-generales': `estadisticas-generales-${new Date().toISOString().split('T')[0]}.pdf`,
        'sin-huella': `fraternos-sin-huella-${new Date().toISOString().split('T')[0]}.pdf`,
        'tallas-ropa': `tallas-ropa-${new Date().toISOString().split('T')[0]}.pdf`,
        'tallas-vestimenta': `tallas-vestimenta-${new Date().toISOString().split('T')[0]}.pdf`
      }
      
      a.download = nombresArchivos[tipo as keyof typeof nombresArchivos] || `reporte-${tipo}.pdf`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      
    } catch (error) {
      console.error('Error exportando PDF:', error)
      alert('Error al generar el reporte PDF: ' + (error instanceof Error ? error.message : 'Verifica que el endpoint exista'))
    } finally {
      setExporting(null)
    }
  }

  const handleExportExcel = (tipo: string) => {
    alert(`Exportando a Excel: ${tipo} - Por implementar`)
  }

  const reportesConfig = [
    {
      id: 'fraternos-genero',
      titulo: 'Distribución por Género',
      descripcion: 'Reporte de fraternos por género (Masculino/Femenino)',
      icono: PieChart,
      color: 'bg-blue-500',
      consulta: 'Consulta directa a fraternos por género' // ← CAMBIADO
    },
    {
      id: 'fraternos-bloques',
      titulo: 'Fraternos por Bloque',
      descripcion: 'Cantidad de miembros en cada bloque',
      icono: BarChart3,
      color: 'bg-green-500',
      consulta: 'JOIN entre bloques y fraternos' // ← CAMBIADO
    },
    {
      id: 'sin-huella',
      titulo: 'Fraternos sin Huella',
      descripcion: 'Lista de miembros sin huella registrada',
      icono: Fingerprint,
      color: 'bg-red-500',
      consulta: 'SELECT con filtro huella_template IS NULL' // ← CAMBIADO
    },
    {
      id: 'tallas-ropa',
      titulo: 'Tallas de Ropa',
      descripcion: 'Reporte de tallas por bloque',
      icono: Shirt,
      color: 'bg-purple-500',
      consulta: 'SELECT talla_blusa, talla_zapato, talla_mantilla' // ← CAMBIADO
    },
    {
      id: 'estadisticas-generales',
      titulo: 'Estadísticas Generales',
      descripcion: 'Totales y resumen general',
      icono: FileText,
      color: 'bg-orange-500',
      consulta: 'Múltiples consultas de totales' // ← CAMBIADO
    },
    {
      id: 'tallas-vestimenta',
      titulo: 'Tallas de Vestimenta',
      descripcion: 'Tallas de blusa, zapato y mantilla',
      icono: Users,
      color: 'bg-pink-500',
      consulta: 'SELECT con GROUP BY tallas' // ← CAMBIADO
    }
  ]

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Reportes Personalizados</h2>
          <p className="text-muted-foreground">Genera reportes específicos usando consultas directas</p>
        </div>
        
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => handleExportExcel('todos')}>
            <Download className="mr-2 h-4 w-4" />
            Exportar Todos (Excel)
          </Button>
        </div>
      </div>

      {/* GRID DE BOTONES DE REPORTES */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {reportesConfig.map((reporte) => {
          const Icono = reporte.icono
          return (
            <Card key={reporte.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${reporte.color} text-white`}>
                    <Icono className="h-6 w-6" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">{reporte.titulo}</CardTitle>
                    <CardDescription>{reporte.descripcion}</CardDescription>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-3">
                <div className="text-xs text-muted-foreground p-2 bg-gray-50 rounded">
                  <strong>Consulta:</strong> {reporte.consulta}
                </div>
                
                <div className="flex gap-2">
                  <Button 
                    onClick={() => handleExportPDF(reporte.id)}
                    disabled={exporting !== null}
                    className="flex-1"
                    variant="default"
                  >
                    <Download className="mr-2 h-4 w-4" />
                    {exporting === reporte.id ? 'Generando...' : 'PDF'}
                  </Button>
                  
                  <Button 
                    onClick={() => handleExportExcel(reporte.id)}
                    variant="outline"
                    className="flex-1"
                  >
                    <FileText className="mr-2 h-4 w-4" />
                    Excel
                  </Button>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>


    </div>
  )
}
