/*import { redirect } from "next/navigation"

export default function Home() {
  redirect("/dashboard")
}*/
// app/page.tsx - REDIRIGIR al login
import { redirect } from 'next/navigation'

export default function HomePage() {
  redirect('/login')
}
