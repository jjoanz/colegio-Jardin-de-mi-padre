import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  // --- Usuario admin inicial -------------------------------------------------
  const passwordHash = await bcrypt.hash("CambiaEstaClave123!", 10);
  await prisma.adminUser.upsert({
    where: { email: "admin@colegiojardindemipadre.com" },
    update: {},
    create: {
      nombre: "Administrador",
      email: "admin@colegiojardindemipadre.com",
      passwordHash,
      rol: "ADMIN",
    },
  });

  // --- Niveles académicos ------------------------------------------------------
  const niveles = [
    { nombre: "Educación Inicial", tarifaInscripcion: 15000, ordenVisual: 1 },
    { nombre: "Educación Primaria", tarifaInscripcion: 18000, ordenVisual: 2 },
    { nombre: "Educación Secundaria", tarifaInscripcion: 20000, ordenVisual: 3 },
  ];
  for (const n of niveles) {
    const existe = await prisma.nivel.findFirst({ where: { nombre: n.nombre } });
    if (!existe) await prisma.nivel.create({ data: n });
  }

  // --- Año escolar y aulas -------------------------------------------------------
  let anioEscolar = await prisma.anioEscolar.findFirst({ where: { nombre: "2026-2027" } });
  if (!anioEscolar) {
    anioEscolar = await prisma.anioEscolar.create({
      data: {
        nombre: "2026-2027",
        fechaInicio: new Date("2026-08-15"),
        fechaFin: new Date("2027-06-15"),
      },
    });
  }

  const nivelInicial = await prisma.nivel.findFirst({ where: { nombre: "Educación Inicial" } });
  if (nivelInicial) {
    const aulaExiste = await prisma.aula.findFirst({ where: { nombre: "Inicial A" } });
    if (!aulaExiste) {
      await prisma.aula.create({
        data: {
          nombre: "Inicial A",
          nivelId: nivelInicial.id,
          tanda: "MATUTINA",
          capacidad: 20,
          anioEscolarId: anioEscolar.id,
        },
      });
    }
  }

  // --- Programas de cuido -------------------------------------------------------
  const cuidoExiste = await prisma.programaCuido.findFirst({ where: { nombre: "Cuido Matutino" } });
  if (!cuidoExiste) {
    await prisma.programaCuido.create({
      data: {
        nombre: "Cuido Matutino",
        horario: "6:30am - 8:00am",
        tarifaMensual: 2500,
      },
    });
  }

  console.log("Seed completado. Usuario admin: admin@colegiojardindemipadre.com / CambiaEstaClave123!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
