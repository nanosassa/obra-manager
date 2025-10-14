import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🔐 Creando usuario administrador...\n')

  const email = 'admin@obramanager.com'
  const password = 'admin123' // Cambiar después del primer login
  const name = 'Administrador'

  // Verificar si ya existe
  const existingUser = await prisma.users.findUnique({
    where: { email }
  })

  if (existingUser) {
    console.log('⚠️  El usuario admin@obramanager.com ya existe')
    return
  }

  // Hash de la contraseña
  const hashedPassword = await bcrypt.hash(password, 10)

  // Crear usuario
  const user = await prisma.users.create({
    data: {
      name,
      email,
      password: hashedPassword,
      role: 'admin',
      activo: true
    }
  })

  console.log('✅ Usuario administrador creado exitosamente!\n')
  console.log('📧 Email:', email)
  console.log('🔑 Contraseña:', password)
  console.log('\n⚠️  IMPORTANTE: Cambia esta contraseña después del primer login\n')
}

main()
  .catch((e) => {
    console.error('❌ Error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
