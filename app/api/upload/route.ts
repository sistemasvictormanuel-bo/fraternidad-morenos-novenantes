import { type NextRequest, NextResponse } from "next/server"
import { writeFile, mkdir } from "fs/promises"
import { join } from "path"
import { existsSync } from "fs"

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get("file") as File
    const type = formData.get("type") as string // "foto"
    const fraternoId = formData.get("fraternoId") as string

    if (!file) {
      return NextResponse.json(
        { success: false, error: "No se proporcionó archivo" },
        { status: 400 }
      )
    }

    // Validaciones para fotos
    const allowedImageTypes = ["image/jpeg", "image/png", "image/webp"]
    const maxSize = 5 * 1024 * 1024 // 5MB
    
    if (!allowedImageTypes.includes(file.type)) {
      return NextResponse.json(
        { success: false, error: "Solo se permiten imágenes JPG, PNG o WebP" },
        { status: 400 }
      )
    }
    
    if (file.size > maxSize) {
      return NextResponse.json(
        { success: false, error: "La imagen no debe superar 5MB" },
        { status: 400 }
      )
    }

    // Crear nombre único para el archivo
    const timestamp = Date.now()
    const fileExtension = file.name.split('.').pop() || 'jpg'
    const fileName = `foto_${fraternoId || 'temp'}_${timestamp}.${fileExtension}`
    const uploadDir = join(process.cwd(), 'public', 'uploads', 'fraternos')
    
    // Crear directorio si no existe
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true })
    }

    const filePath = join(uploadDir, fileName)
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    
    await writeFile(filePath, buffer)

    // Devolver la ruta relativa para guardar en BD
    const relativePath = `/uploads/fraternos/${fileName}`

    return NextResponse.json({
      success: true,
      data: {
        path: relativePath,
        fileName: fileName
      }
    })

  } catch (error) {
    console.error("[v0] Error uploading file:", error)
    return NextResponse.json(
      { success: false, error: "Error al subir archivo" },
      { status: 500 }
    )
  }
}