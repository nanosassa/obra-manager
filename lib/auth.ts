import { NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import GoogleProvider from "next-auth/providers/google"
import bcrypt from "bcryptjs"
import prisma from "@/lib/prisma"

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          prompt: "consent",
          access_type: "offline",
          response_type: "code"
        }
      }
    }),
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email", placeholder: "tu@email.com" },
        password: { label: "Contraseña", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Email y contraseña son requeridos")
        }

        // Buscar usuario incluyendo campo aprobado
        const user = await prisma.users.findUnique({
          where: { email: credentials.email },
          select: {
            id: true,
            name: true,
            email: true,
            password: true,
            role: true,
            activo: true,
            aprobado: true
          }
        })

        if (!user || !user.activo) {
          throw new Error("Credenciales inválidas o usuario inactivo")
        }

        // Verificar si el usuario está aprobado (solo para viewers registrados)
        if (user.aprobado === false && user.role === 'viewer') {
          throw new Error("Tu cuenta está pendiente de aprobación por un administrador")
        }

        if (!user.password) {
          throw new Error("Credenciales inválidas")
        }

        const isPasswordValid = await bcrypt.compare(
          credentials.password,
          user.password
        )

        if (!isPasswordValid) {
          throw new Error("Credenciales inválidas")
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role || "user"
        }
      }
    })
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      // Si es login con credenciales, ya pasó por authorize()
      if (account?.provider === "credentials") {
        return true
      }

      // Si es login con Google
      if (account?.provider === "google" && profile?.email) {
        try {
          // Buscar usuario existente por email
          let dbUser = await prisma.users.findUnique({
            where: { email: profile.email }
          })

          // Si no existe, crear nuevo usuario
          if (!dbUser) {
            dbUser = await prisma.users.create({
              data: {
                email: profile.email,
                name: profile.name || profile.email.split('@')[0],
                role: "viewer", // Los usuarios de Google entran como viewer
                oauth_provider: "google",
                oauth_id: account.providerAccountId,
                aprobado: false, // Requieren aprobación
                activo: true,
                password: null // Sin contraseña porque usan OAuth
              }
            })
          } else {
            // Si existe pero no tiene oauth configurado, actualizar
            if (!dbUser.oauth_provider) {
              await prisma.users.update({
                where: { id: dbUser.id },
                data: {
                  oauth_provider: "google",
                  oauth_id: account.providerAccountId
                }
              })
            }
          }

          // Verificar si está aprobado (solo para viewers)
          if (dbUser.role === 'viewer' && dbUser.aprobado === false) {
            // Redirigir a página de espera de aprobación
            return '/login?error=pending_approval'
          }

          // Verificar si está activo
          if (!dbUser.activo) {
            return '/login?error=inactive_account'
          }

          return true
        } catch (error) {
          console.error("Error en signIn callback:", error)
          return false
        }
      }

      return true
    },
    async jwt({ token, user, account }) {
      // Primera vez que se crea el token
      if (account && user) {
        // Buscar el usuario en la BD para obtener su rol e ID
        const dbUser = await prisma.users.findUnique({
          where: { email: user.email! },
          select: { id: true, role: true, oauth_provider: true }
        })

        if (dbUser) {
          token.id = dbUser.id
          token.role = dbUser.role || "viewer"
          token.oauthProvider = dbUser.oauth_provider
        }
      }

      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string
        session.user.role = token.role as string
        session.user.oauthProvider = token.oauthProvider as string | null
      }
      return session
    }
  },
  pages: {
    signIn: '/login',
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 días
  },
  secret: process.env.NEXTAUTH_SECRET,
}
