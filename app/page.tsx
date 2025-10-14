import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export default async function HomePage() {
  const session = await getServerSession(authOptions)

  // Si está autenticado, redirigir al dashboard
  // Si no, redirigir al login
  if (session) {
    redirect('/dashboard')
  } else {
    redirect('/login')
  }
}
