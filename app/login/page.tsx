"use client"

import React, { useState } from "react"
import { useRouter } from "next/navigation" // ✅ AGREGAR esto
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2 } from "lucide-react"
import Image from "next/image"

export default function LoginPage() {
  const router = useRouter() // ✅ AGREGAR esto
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    
    if (!username.trim() || !password.trim()) {
      setError("Usuario y contraseña son requeridos")
      return
    }

    setLoading(true)

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || "Credenciales incorrectas")
        setLoading(false)
        return
      }

      // ✅ DESCOMENTAR estas líneas:
      if (data.user.role === 'admin') {
        router.push("/dashboard")
      } else if (data.user.role === 'fraterno') {
        router.push("/fraterno/dashboard")
      }
      
      router.refresh()
      
    } catch (err) {
      setError("Error de conexión. Intenta nuevamente.")
      setLoading(false)
    }
  }

  // ✅ El resto de tu código se mantiene IGUAL
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 p-4">
      <Card className="w-full max-w-md shadow-2xl border-blue-200">
        <CardHeader className="space-y-4 text-center pb-6">
          <div className="flex items-center justify-center">
            <Image
              src="/logo2026.png"
              alt="Logo Fraternidad Morenada Novenantes"
              width={96}
              height={96}
              className="object-contain"
              onError={(e) => {
                e.currentTarget.style.display = 'none'
              }}
            />
          </div>
          
          <div>
            <CardTitle className="text-2xl font-bold bg-gradient-to-r from-blue-700 to-pink-700 bg-clip-text text-transparent">
              Fraternidad Morenada
            </CardTitle>
            <CardDescription className="text-base mt-1">
              Novenantes - Sistema de Gestión
            </CardDescription>
          </div>
        </CardHeader>
        
        <CardContent className="pt-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username" className="text-sm font-medium">
                Usuario
              </Label>
              <Input
                id="username"
                type="text"
                placeholder="Ingresa tu usuario"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                disabled={loading}
                className="border-blue-200 focus:border-blue-500"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium">
                Contraseña
              </Label>
              <Input
                id="password"
                type="password"
                placeholder="Ingresa tu contraseña"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
                className="border-blue-200 focus:border-blue-500"
              />
            </div>

            {error && (
              <Alert variant="destructive" className="mt-4">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-blue-600 to-pink-700 hover:from-blue-700 hover:to-pink-800 text-white font-semibold py-2 h-11"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Iniciando sesión...
                </>
              ) : (
                "Iniciar Sesión"
              )}
            </Button>
          </form>

          <div className="mt-6 text-center text-sm text-gray-600 border-t pt-4">
            <p className="font-medium mb-2">Roles disponibles:</p>
            <div className="space-y-1">
              <p className="font-semibold text-blue-700">Admin - Acceso completo</p>
              <p className="font-semibold text-pink-700">Fraterno - Acceso personal</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}