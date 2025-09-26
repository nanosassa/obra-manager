# Dockerfile para Next.js 15 - Production
FROM node:18-alpine AS base

# Instalar dependencias solo cuando sea necesario
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Instalar dependencias basado en el gestor de paquetes preferido
COPY package.json package-lock.json* ./
RUN npm install

# Rebuild el código fuente solo cuando sea necesario
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Generar Prisma Client
RUN npx prisma generate

# Construir la aplicación
ENV NEXT_TELEMETRY_DISABLED=1
# Dummy DATABASE_URL para el build (será reemplazada en runtime)
ENV DATABASE_URL="postgresql://dummy:dummy@dummy:5432/dummy?schema=public"
RUN npm run build

# Imagen de producción, copiar todos los archivos y ejecutar next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public

# Establecer los permisos correctos para prerender cache
RUN mkdir .next
RUN chown nextjs:nodejs .next

# Copiar automáticamente los archivos de salida aprovechando las salidas del `next build`
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Comando para ejecutar la aplicación
CMD ["node", "server.js"]