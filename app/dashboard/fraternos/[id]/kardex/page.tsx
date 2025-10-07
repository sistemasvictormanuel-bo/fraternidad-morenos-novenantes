import { FraternoKardex } from "@/components/fraterno-kardex"

interface KardexPageProps {
  params: Promise<{ id: string }>
}

export default async function KardexPage({ params }: KardexPageProps) {
  const { id } = await params

  return <FraternoKardex fraternoId={Number.parseInt(id)} />
}
