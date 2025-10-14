import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🔄 Aprobando usuarios existentes...\n')

  const result = await prisma.users.updateMany({
    where: {},
    data: {
      aprobado: true
    }
  })

  console.log(`✅ ${result.count} usuarios aprobados\n`)
}

main()
  .catch((e) => {
    console.error('❌ Error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
