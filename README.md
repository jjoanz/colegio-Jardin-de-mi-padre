# Plataforma del Colegio

Landing page pública + formulario de inscripción + perfil digital del alumno +
panel administrativo (cuido, actividades/campamentos, especiales, cargos y pagos).

Los pagos, por ahora, se registran **manualmente** (enlace de pago Azul, transferencia
o efectivo) — no hay integración automática todavía. La facturación electrónica /DGII
queda para una fase futura.

## Stack

- **Next.js 16** (App Router) + TypeScript + Tailwind CSS
- **PostgreSQL** + **Prisma** ORM
- **NextAuth v5** (login del panel admin con roles)

## 1. Requisitos en el VPS de Hostinger

- Plan **VPS (KVM)** de Hostinger, no el hosting compartido — Node.js necesita un VPS.
- Node.js 20+ y PostgreSQL instalados (Hostinger tiene plantillas de VPS con esto
  preinstalado; si no, `hPanel > VPS > Aplicaciones` permite instalar Node.js y
  PostgreSQL con un clic, o por SSH con el gestor de paquetes de la distro).
- PM2 para mantener la app corriendo (`npm install -g pm2`).

## 2. Configuración inicial

```bash
# Clonar/subir el proyecto al VPS
cd colegio-platform
npm install                     # esto ejecuta "prisma generate" automáticamente

cp .env.example .env
# Editar .env con los datos reales:
#   DATABASE_URL, NEXTAUTH_URL, NEXTAUTH_SECRET, datos del colegio
```

Generar un secreto seguro para `NEXTAUTH_SECRET`:

```bash
openssl rand -base64 32
```

## 3. Base de datos

```bash
npx prisma migrate deploy      # crea todas las tablas en PostgreSQL
npm run db:seed                # crea el usuario admin inicial + datos de ejemplo
```

Esto crea el usuario administrador:
- **Correo:** admin@colegio.edu.do
- **Contraseña:** CambiaEstaClave123!

**Cambia esta contraseña de inmediato** desde la base de datos o creando un nuevo
usuario admin y desactivando este.

## 4. Construir y correr en producción

```bash
npm run build
pm2 start npm --name "colegio-platform" -- start
pm2 save
pm2 startup   # sigue las instrucciones para que arranque solo con el servidor
```

Configura un proxy inverso (Nginx, que Hostinger suele incluir) apuntando al puerto
3000 hacia tu dominio, por ejemplo `portal.colegio.edu.do`, con certificado SSL
(Hostinger ofrece Let's Encrypt gratis desde hPanel).

## 5. Estructura del proyecto

```
app/
  page.tsx                 → landing pública
  inscripcion/page.tsx     → formulario público de inscripción
  api/inscripcion/         → recibe las solicitudes del formulario
  admin/login/             → login del panel (fuera del layout con sidebar)
  admin/(panel)/           → panel administrativo protegido
    page.tsx               → dashboard con estadísticas
    solicitudes/           → aprobar/rechazar inscripciones nuevas
    estudiantes/           → perfil y balance de cada alumno
    padres/                → tutores y sus hijos vinculados
    cuido/                 → programas de cuido
    actividades/           → actividades y campamentos
    especiales/            → descuentos/promociones
    cargos/                → cuentas por cobrar
    pagos/                 → registro manual de pagos
lib/
  prisma.ts                → cliente de Prisma
  auth.ts                  → configuración de NextAuth
  actions.ts               → server actions (aprobar solicitud, registrar pago, etc.)
prisma/
  schema.prisma            → modelo completo de datos
  seed.ts                  → datos iniciales
```

## 6. Flujo de inscripción y cobro (fase actual)

1. Un padre llena `/inscripcion` → se crea una `SolicitudInscripcion`.
2. La secretaría revisa en `/admin/solicitudes` y aprueba.
   Al aprobar se crean automáticamente: el `Estudiante`, el `Tutor` (si no existía),
   la inscripción de cuido (si aplicó) y un `Cargo` de matrícula.
3. La secretaría/contabilidad genera un enlace de pago de Azul manualmente y se lo
   envía a la familia (WhatsApp, correo, etc.).
4. Cuando el pago llega, se registra en `/admin/pagos`, seleccionando el cargo y
   adjuntando la referencia del enlace. El balance del estudiante se recalcula solo.

## 7. Próximas fases (no incluidas aún)

- **Fase 2:** Integración automática con la Payment Page de Azul (requiere ser
  comercio afiliado con Banco Popular) y facturación electrónica vía un proveedor
  certificado de e-CF, con miras a la DGII.
- **Fase 3:** Portal para que los propios padres vean el balance de sus hijos y
  reciban notificaciones automáticas.

## 8. Nota sobre este entorno de desarrollo

Este proyecto se generó en un entorno sin acceso a internet completo, por lo que
`prisma generate` no pudo ejecutarse aquí (Prisma descarga sus motores desde
`binaries.prisma.sh`). Esto es normal y se resuelve solo al correr `npm install`
en el VPS con internet real — no requiere ningún cambio en el código.
