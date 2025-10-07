"use client"
import { Users, Layers, Calendar, FileText, Home, Fingerprint } from "lucide-react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import {  UserPlus ,LogOut} from 'lucide-react'

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
} from "@/components/ui/sidebar"

const menuItems = [
  {
    title: "Dashboard",
    url: "/dashboard",
    icon: Home,
  },
  {
    title: "Fraternos",
    url: "/dashboard/fraternos",
    icon: Users,
  },
  {
    title: "Bloques",
    url: "/dashboard/bloques",
    icon: Layers,
  },
  {
    title: "Eventos",
    url: "/dashboard/eventos",
    icon: Calendar,
  },
  {
    title: "Inscripciones",
    url: "/dashboard/inscripciones",
    icon: Fingerprint,
  },
  {
    title: "Verificar Huella",
    url: "/dashboard/verificar-huella",
    icon: Fingerprint,
  },
  {
    title: "Reportes",
    url: "/dashboard/reportes",
    icon: FileText,
  },
  {
    title: "Gestión de Usuarios",
    url: "/dashboard/usuarios", 
    icon: Users,
    subitems: [
      {
        title: "Lista de Usuarios",
        url: "/dashboard/usuarios",
        icon: Users
      },
      {
        title: "Crear Usuario", 
        url: "/dashboard/usuarios/crear",
        icon: UserPlus
      }
    ]
  },
]

export function AppSidebar() {
  const pathname = usePathname()
  const router = useRouter()

  const handleLogout = async () => {
    try {
      const response = await fetch('/api/auth/logout', {
        method: 'POST'
      })
      
      if (response.ok) {
        window.location.href = '/login'
      }
    } catch (error) {
      window.location.href = '/login'
    }
  }

  return (
    <Sidebar>
      <SidebarHeader className="border-b border-sidebar-border p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Users className="h-6 w-6" />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-semibold">Fraternidad</span>
            <span className="text-xs text-muted-foreground">Morenada Novenantes</span>
          </div>
        </div>
      </SidebarHeader>
      
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Gestión</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  {item.subitems ? (
                    // Item con submenú
                    <SidebarMenuButton asChild>
                      <Link href={item.url}>
                        <item.icon className="h-4 w-4" />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  ) : (
                    // Item normal
                    <SidebarMenuButton asChild isActive={pathname === item.url}>
                      <Link href={item.url}>
                        <item.icon className="h-4 w-4" />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  )}
                  
                  {/* Renderizar subitems si existen */}
                  {item.subitems && (
                    <SidebarMenuSub>
                      {item.subitems.map((subitem) => (
                        <SidebarMenuSubItem key={subitem.title}>
                          <SidebarMenuSubButton asChild isActive={pathname === subitem.url}>
                            <Link href={subitem.url}>
                              <subitem.icon className="h-4 w-4" />
                              <span>{subitem.title}</span>
                            </Link>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                      ))}
                    </SidebarMenuSub>
                  )}
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      
      <SidebarFooter className="border-t border-sidebar-border p-4">
        <div className="space-y-2">
          {/* Botón de Logout */}
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm font-medium text-muted-foreground transition-all hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
          >
            <LogOut className="h-4 w-4" />
            <span>Cerrar Sesión</span>
          </button>
          
          {/* Información de versión */}
          <div className="text-xs text-muted-foreground">
            <p className="font-medium">Sistema de Gestión</p>
            <p>Versión 1.0.0</p>
          </div>
        </div>
      </SidebarFooter>
    </Sidebar>
  )
}