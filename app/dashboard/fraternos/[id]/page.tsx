import { FraternoForm } from "@/components/fraterno-form"
import type { Fraterno } from "@/lib/types"

async function getFraterno(id: string): Promise<Fraterno | null> {
  try {
    // ✅ SOLUCIÓN: Usar URL relativa
    const response = await fetch(`/api/fraternos/${id}`, {
      cache: "no-store",
    })
    const data = await response.json()
    return data.success ? data.data : null
  } catch (error) {
    console.error("[v0] Error fetching fraterno:", error)
    return null
  }
}

export default async function EditFraternoPage({ params }: { params: { id: string } }) {
  const fraterno = await getFraterno(params.id)

  if (!fraterno) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <p className="text-muted-foreground">Fraterno no encontrado</p>
      </div>
    )
  }

  return <FraternoForm fraterno={fraterno} isEdit />
}
