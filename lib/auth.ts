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
        identificador: { label: "Correo o cédula", type: "text" },
        password: { label: "Contraseña", type: "password" },
      },
      authorize: async (credentials) => {
        const identificador = credentials?.identificador as string | undefined;
        const password = credentials?.password as string | undefined;
        if (!identificador || !password) return null;

        // 1. Personal del colegio (AdminUser) — correo o cédula.
        const staff = await prisma.adminUser.findFirst({
          where: { OR: [{ email: identificador }, { cedula: identificador }] },
          include: {
            role: { include: { permisos: { include: { permission: true } } } },
          },
        });
        if (staff && staff.activo && (await bcrypt.compare(password, staff.passwordHash))) {
          // Lista de permisos en formato "modulo:accion", ej. "estudiantes:ver".
          // Si el usuario todavía no tiene un Role nuevo asignado (por si algún
          // usuario viejo quedó sin migrar), cae de vuelta al enum legacy "rol"
          // solo para el nombre, sin permisos granulares.
          const permisos = staff.role
            ? staff.role.permisos.map((rp) => `${rp.permission.modulo}:${rp.permission.accion}`)
            : [];

          return {
            id: staff.id,
            name: staff.nombre,
            email: staff.email,
            role: staff.role?.nombre ?? staff.rol,
            permisos,
            tipoUsuario: "STAFF" as const,
            debeCambiarPassword: staff.debeCambiarPassword,
          };
        }

        // 2. Padres/tutores (Tutor) — correo o cédula.
        const tutor = await prisma.tutor.findFirst({
          where: { OR: [{ email: identificador }, { cedula: identificador }] },
        });
        if (
          tutor &&
          tutor.activo &&
          tutor.passwordHash &&
          (await bcrypt.compare(password, tutor.passwordHash))
        ) {
          return {
            id: tutor.id,
            name: `${tutor.nombre} ${tutor.apellido}`.trim(),
            email: tutor.email,
            role: "PADRE",
            permisos: [] as string[],
            tipoUsuario: "PADRE" as const,
            debeCambiarPassword: tutor.debeCambiarPassword,
          };
        }

        return null;
      },
    }),
  ],
  callbacks: {
    jwt: async ({ token, user }) => {
      if (user) {
        token.id = (user as { id?: string }).id;
        token.role = (user as { role?: string }).role;
        token.permisos = (user as { permisos?: string[] }).permisos ?? [];
        token.tipoUsuario = (user as { tipoUsuario?: string }).tipoUsuario;
        token.debeCambiarPassword = (user as { debeCambiarPassword?: boolean }).debeCambiarPassword ?? false;
      }
      return token;
    },
    session: async ({ session, token }) => {
      if (session.user) {
        const user = session.user as {
          id?: string;
          role?: string;
          permisos?: string[];
          tipoUsuario?: string;
          debeCambiarPassword?: boolean;
        };
        user.id = token.id as string;
        user.role = token.role as string;
        user.permisos = (token.permisos as string[]) ?? [];
        user.tipoUsuario = token.tipoUsuario as string;
        user.debeCambiarPassword = (token.debeCambiarPassword as boolean) ?? false;
      }
      return session;
    },
  },
});
