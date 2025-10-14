import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🔄 Actualizando rol del usuario admin...\n')

  const email = 'admin@obramanager.com'

  // Actualizar usuario
  const user = await prisma.users.update({
    where: { email },
    data: {
      role: 'super_admin'
    }
  })

  console.log('✅ Usuario actualizado exitosamente!\n')
  console.log('📧 Email:', user.email)
  console.log('👤 Nombre:', user.name)
  console.log('🔐 Rol:', user.role)
  console.log('\n')
}

main()
  .catch((e) => {
    console.error('❌ Error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
