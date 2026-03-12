import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const webhookUrl = process.env.N8N_CHAT_WEBHOOK_URL
  if (!webhookUrl) {
    return NextResponse.json(
      { error: 'El servicio de chat no está configurado' },
      { status: 500 }
    )
  }

  try {
    const { chatInput, sessionId } = await request.json()

    if (!chatInput || !sessionId) {
      return NextResponse.json(
        { error: 'Faltan campos requeridos' },
        { status: 400 }
      )
    }

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chatInput, sessionId }),
    })

    if (!response.ok) {
      throw new Error(`Webhook respondió con estado ${response.status}`)
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('Error en chat-gastos:', error)
    return NextResponse.json(
      { error: 'Error al conectar con el asistente' },
      { status: 502 }
    )
  }
}
