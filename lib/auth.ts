import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

export const { handlers, signIn, signOut, auth } = NextAuth({
  session: { strategy: "jwt" },
  pages: {
    signIn: "/admin/login",
  },
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Contraseña", type: "password" },
      },
      authorize: async (credentials) => {
        const email = credentials?.email as string | undefined;
        const password = credentials?.password as string | undefined;
        if (!email || !password) return null;

        const user = await prisma.adminUser.findUnique({
          where: { email },
          include: {
            role: { include: { permisos: { include: { permission: true } } } },
          },
        });
        if (!user || !user.activo) return null;

        const valid = await bcrypt.compare(password, user.passwordHash);
        if (!valid) return null;

        // Lista de permisos en formato "modulo:accion", ej. "estudiantes:ver".
        // Si el usuario todavía no tiene un Role nuevo asignado (por si algún
        // usuario viejo quedó sin migrar), cae de vuelta al enum legacy "rol"
        // solo para el nombre, sin permisos granulares.
        const permisos = user.role
          ? user.role.permisos.map((rp) => `${rp.permission.modulo}:${rp.permission.accion}`)
          : [];

        return {
          id: user.id,
          name: user.nombre,
          email: user.email,
          role: user.role?.nombre ?? user.rol,
          permisos,
        };
      },
    }),
  ],
  callbacks: {
    jwt: async ({ token, user }) => {
      if (user) {
        token.id = (user as { id?: string }).id;
        token.role = (user as { role?: string }).role;
        token.permisos = (user as { permisos?: string[] }).permisos ?? [];
      }
      return token;
    },
    session: async ({ session, token }) => {
      if (session.user) {
        (session.user as { id?: string; role?: string; permisos?: string[] }).id =
          token.id as string;
        (session.user as { role?: string; permisos?: string[] }).role = token.role as string;
        (session.user as { role?: string; permisos?: string[] }).permisos =
          (token.permisos as string[]) ?? [];
      }
      return session;
    },
  },
});
