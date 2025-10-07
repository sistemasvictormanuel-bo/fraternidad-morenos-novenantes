import { type NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { jwtVerify } from "jose"
import { getUserById } from "@/lib/auth"

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || "fraternidad-morenada-secret-key-2024")

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get("auth-token")

    if (!token) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 })
    }

    const { payload } = await jwtVerify(token.value, JWT_SECRET)
    const user = await getUserById(payload.id as number)

    if (!user) {
      return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 })
    }

    return NextResponse.json({
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
        fraterno_id: user.fraterno_id,
      },
    })
  } catch (error) {
    console.error("[v0] Auth check error:", error)
    return NextResponse.json({ error: "Token inválido" }, { status: 401 })
  }
}
