// Tipos TypeScript basados en el esquema MySQL de la Fraternidad Morenada Novenantes

export type TipoBloque = "Tropa" | "Independientes" | "Especial"
export type Genero = "Masculino" | "Femenino"
export type EstadoFraterno = "Activo" | "Inactivo" | "Suspendido"
export type EstadoBloque = "Activo" | "Inactivo"
export type UserRole = "admin" | "fraterno"

export interface Fraterno {
  id: number
  user_id?: number
  ci: string
  fechanacimiento: string
  nombre: string
  celular: string
  foto?: string
  genero: Genero
  bloque_id?: number
  nombre_bloque?: string    // Viene del JOIN con bloques
  tipobloque?: string   
  talla_blusa?: string
  talla_zapato?: string
  talla_mantilla?: string
  tela_traje?: string
  tela_pollera?: string
  corse?: string
  monto_tela_traje?: number
  monto_tela_pollera?: number
  monto_corse?: number
  estado: EstadoFraterno
  huella_template?: string // Template biométrico de SourceAFIS
  created_at: string
  updated_at: string
  bloque?: Bloque
}

export interface Bloque {
  id: number
  nombre_bloque: string
  estado: EstadoBloque
  fraterno_id?: number // ID del responsable del bloque
  tipobloque: TipoBloque
  created_at: string
  updated_at: string
  responsable?: Fraterno
  miembros?: Fraterno[]
}

export interface Evento {
  id: number
  nombre: string
  descripcion?: string
  fecha_evento: string
  tipo_evento_id: number
  created_at: string
  updated_at: string
  tipo_evento?: TipoEvento
}

export interface TipoEvento {
  id: number
  nombre: string
  descripcion?: string
}

export interface Inscripcion {
  id: number
  fraterno_id: number
  evento_id: number
  fecha_inscripcion: string
  created_at: string
  updated_at: string
  fraterno?: Fraterno
  evento?: Evento
}
export interface Usuario {
  id: number
  username: string
  role: 'admin' | 'fraterno'
  fraterno_id?: number
  created_at: string
  updated_at: string
  // Campos opcionales para JOIN
  fraterno_nombre?: string
}

export type UsuarioFormData = {
  username: string
  password?: string
  role: 'admin' | 'fraterno'
  fraterno_id?: number
}


// Tipos para formularios
export interface FraternoFormData {
  id?: number
  ci: string
  fechanacimiento: string
  nombre: string
  celular: string
  foto?: string
  genero: Genero
  bloque_id?: number
  talla_blusa?: string
  talla_zapato?: string
  talla_mantilla?: string
  tela_traje?: string
  tela_pollera?: string
  corse?: string
  monto_tela_traje?: number
  monto_tela_pollera?: number
  monto_corse?: number
  estado: EstadoFraterno
}

export interface BloqueFormData {
  nombre_bloque: string
  estado: EstadoBloque
  fraterno_id?: number
  tipobloque: TipoBloque
}

export interface EventoFormData {
  nombre: string
  descripcion?: string
  fecha_evento: string
  tipo_evento_id: number
}

// Tipos para reportes
export interface ReporteEstadisticas {
  total_fraternos: number
  fraternos_activos: number
  fraternos_inactivos: number
  total_bloques: number
  total_inscripciones: number
  fraternos_por_bloque: { bloque: string; cantidad: number }[]
  fraternos_por_genero: { genero: string; cantidad: number }[]
}
