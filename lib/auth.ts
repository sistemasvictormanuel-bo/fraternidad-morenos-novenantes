// Sistema de autenticación para la Fraternidad Morenada Novenantes
import { query } from "./db"
import type { User, UserRole } from "./types"
import bcrypt from "bcryptjs"

// Función para hashear contraseñas
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10)
}

// Función para verificar contraseñas
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash)
}

// Función para autenticar usuario
export async function authenticateUser(username: string, password: string): Promise<User | null> {
  try {
    const users = await query<User[]>("SELECT * FROM usuarios WHERE username = ? LIMIT 1", [username])

    if (users.length === 0) {
      return null
    }

    const user = users[0]
    const isValid = await verifyPassword(password, user.password_hash)

    if (!isValid) {
      return null
    }

    return user
  } catch (error) {
    console.error("[v0] Error authenticating user:", error)
    return null
  }
}

// Función para obtener usuario por ID
export async function getUserById(id: number): Promise<User | null> {
  try {
    const users = await query<User[]>(
      `SELECT u.*, f.nombre as fraterno_nombre, f.bloque_id 
       FROM usuarios u 
       LEFT JOIN fraternos f ON u.fraterno_id = f.id 
       WHERE u.id = ? LIMIT 1`,
      [id],
    )

    return users.length > 0 ? users[0] : null
  } catch (error) {
    console.error("[v0] Error getting user:", error)
    return null
  }
}

// Función para verificar permisos según rol
export function canAccessAllData(role: UserRole): boolean {
  return role === "admin"
}

export function canAccessBloqueData(role: UserRole, userBloqueId?: number, targetBloqueId?: number): boolean {
  if (role === "admin") return true
  if (role === "fraterno" && userBloqueId && targetBloqueId) {
    return userBloqueId === targetBloqueId
  }
  return false
}
