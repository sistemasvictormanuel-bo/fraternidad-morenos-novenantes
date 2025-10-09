import { type NextRequest, NextResponse } from "next/server"
import { v2 as cloudinary } from 'cloudinary'

// Configurar Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

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

    // Validaciones para fotos (igual que antes)
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

    // Convertir File a buffer
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Subir a Cloudinary
    const result = await new Promise((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        {
          folder: "fraternos",
          public_id: `foto_${fraternoId || 'temp'}_${Date.now()}`,
          resource_type: "image",
          transformation: [
            { width: 800, height: 800, crop: "limit" }, // Redimensionar
            { quality: "auto" } // Optimizar calidad
          ]
        },
        (error, result) => {
          if (error) reject(error)
          else resolve(result)
        }
      ).end(buffer)
    })

    // El resultado de Cloudinary contiene la URL segura
    const cloudinaryResult = result as any

    return NextResponse.json({
      success: true,
      data: {
        path: cloudinaryResult.secure_url, // URL completa de Cloudinary
        fileName: cloudinaryResult.public_id,
        width: cloudinaryResult.width,
        height: cloudinaryResult.height
      }
    })

  } catch (error) {
    console.error("[v0] Error uploading to Cloudinary:", error)
    return NextResponse.json(
      { success: false, error: "Error al subir archivo a Cloudinary" },
      { status: 500 }
    )
  }
}
