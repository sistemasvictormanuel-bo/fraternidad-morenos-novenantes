import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || "fraternidad-morenada-secret-key-2024")

export async function middleware(request: NextRequest) {
  // Para reactivar el login, descomenta todo el código a continuación

  /*
  const { pathname } = request.nextUrl

  // Rutas públicas que no requieren autenticación
  if (pathname === "/login" || pathname.startsWith("/api/auth/login")) {
    return NextResponse.next()
  }

  // Verificar token para rutas protegidas
  if (pathname.startsWith("/dashboard") || pathname.startsWith("/api")) {
    const token = request.cookies.get("auth-token")

    if (!token) {
      if (pathname.startsWith("/api")) {
        return NextResponse.json({ error: "No autenticado" }, { status: 401 })
      }
      return NextResponse.redirect(new URL("/login", request.url))
    }

    try {
      const { payload } = await jwtVerify(token.value, JWT_SECRET)

      // Agregar información del usuario a los headers
      const requestHeaders = new Headers(request.headers)
      requestHeaders.set("x-user-id", String(payload.id))
      requestHeaders.set("x-user-role", String(payload.role))
      if (payload.fraterno_id) {
        requestHeaders.set("x-fraterno-id", String(payload.fraterno_id))
      }

      return NextResponse.next({
        request: {
          headers: requestHeaders,
        },
      })
    } catch (error) {
      console.error("[v0] JWT verification failed:", error)
      if (pathname.startsWith("/api")) {
        return NextResponse.json({ error: "Token inválido" }, { status: 401 })
      }
      return NextResponse.redirect(new URL("/login", request.url))
    }
  }
  */

  return NextResponse.next()
}

export const config = {
  matcher: ["/dashboard/:path*", "/api/:path*", "/login"],
}
