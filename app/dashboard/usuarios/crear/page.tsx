// app/dashboard/usuarios/crear/page.tsx
"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ArrowLeft, Save } from "lucide-react"
import Link from "next/link"

interface Fraterno {
    id: number
    nombre: string
}

export default function CrearUsuarioPage() {
    const router = useRouter()
    const [formData, setFormData] = useState({
        username: '',
        password: '',
        role: 'fraterno' as 'admin' | 'fraterno',
        fraterno_id: ''
    })
    const [fraternos, setFraternos] = useState<Fraterno[]>([])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    useEffect(() => {
        fetchFraternos()
    }, [])

    const fetchFraternos = async () => {
        try {
            const response = await fetch('/api/fraternos')
            const data = await response.json()
            if (data.success) {
                setFraternos(data.data)
            }
        } catch (error) {
            console.error("Error fetching fraternos:", error)
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')
        setLoading(true)

        try {
            const response = await fetch('/api/usuarios', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...formData,
                    fraterno_id: formData.fraterno_id ? parseInt(formData.fraterno_id) : null
                })
            })

            const data = await response.json()

            if (data.success) {
                router.push('/dashboard/usuarios')
                alert('Usuario creado exitosamente')
            } else {
                setError(data.error || 'Error creando usuario')
            }
        } catch (error) {
            setError('Error de conexión')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Link href="/dashboard/usuarios">
                    <Button variant="ghost" size="icon">
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                </Link>
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Crear Usuario</h2>
                    <p className="text-muted-foreground">Agregar nuevo usuario al sistema</p>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Información del Usuario</CardTitle>
                    <CardDescription>Complete los datos del nuevo usuario</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid gap-4 md:grid-cols-2">
                            <div className="space-y-2">
                                <Label htmlFor="username">Usuario *</Label>
                                <Input
                                    id="username"
                                    value={formData.username}
                                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                                    placeholder="nombre.usuario"
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="password">Contraseña *</Label>
                                <Input
                                    id="password"
                                    type="password"
                                    value={formData.password}
                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                    placeholder="••••••••"
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="role">Rol *</Label>
                                <Select
                                    value={formData.role}
                                    onValueChange={(value: 'admin' | 'fraterno') =>
                                        setFormData({ ...formData, role: value })
                                    }
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="admin">Administrador</SelectItem>
                                        <SelectItem value="fraterno">Fraterno</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="fraterno_id">Fraterno Asociado</Label>
                                <Select
                                    value={formData.fraterno_id}
                                    onValueChange={(value) =>
                                        setFormData({ ...formData, fraterno_id: value })
                                    }
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Seleccionar fraterno" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {/* ✅ CORREGIDO: Usar "0" en lugar de "" */}
                                        <SelectItem value="0">No asociado</SelectItem>
                                        {fraternos.map((fraterno) => (
                                            <SelectItem key={fraterno.id} value={fraterno.id.toString()}>
                                                {fraterno.nombre}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        {error && (
                            <Alert variant="destructive">
                                <AlertDescription>{error}</AlertDescription>
                            </Alert>
                        )}

                        <div className="flex gap-2 pt-4">
                            <Button type="submit" disabled={loading}>
                                <Save className="mr-2 h-4 w-4" />
                                {loading ? 'Creando...' : 'Crear Usuario'}
                            </Button>
                            <Link href="/dashboard/usuarios">
                                <Button variant="outline" type="button">
                                    Cancelar
                                </Button>
                            </Link>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    )
}