import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Rutas públicas que no requieren autenticación
  if (pathname === "/login" || pathname.startsWith("/api/auth/login")) {
    return NextResponse.next()
  }

  // Verificar cookie para rutas protegidas
  if (pathname.startsWith("/dashboard") || pathname.startsWith("/api")) {
    // ✅ BUSCAR COOKIE 'user' (que es la que guarda tu login)
    const userCookie = request.cookies.get("user")

    if (!userCookie) {
      if (pathname.startsWith("/api")) {
        return NextResponse.json({ error: "No autenticado" }, { status: 401 })
      }
      return NextResponse.redirect(new URL("/login", request.url))
    }

    try {
      // ✅ VERIFICACIÓN SIMPLE - solo que exista y sea JSON válido
      const userData = JSON.parse(userCookie.value)
      
      // Agregar información del usuario a los headers
      const requestHeaders = new Headers(request.headers)
      requestHeaders.set("x-user-id", String(userData.id))
      requestHeaders.set("x-user-role", String(userData.role))
      if (userData.fraterno_id) {
        requestHeaders.set("x-fraterno-id", String(userData.fraterno_id))
      }

      return NextResponse.next({
        request: {
          headers: requestHeaders,
        },
      })
    } catch (error) {
      console.error("[v0] Cookie verification failed:", error)
      if (pathname.startsWith("/api")) {
        return NextResponse.json({ error: "Sesión inválida" }, { status: 401 })
      }
      return NextResponse.redirect(new URL("/login", request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/dashboard/:path*", "/api/:path*", "/login"],
}
