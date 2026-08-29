import { NextResponse } from "next/server";
import * as XLSX from "xlsx";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const DIA_LABEL: Record<string, string> = {
  LUNES: "Lunes",
  MARTES: "Martes",
  MIERCOLES: "Miércoles",
  JUEVES: "Jueves",
  VIERNES: "Viernes",
  SABADO: "Sábado",
};

function minutosAHora(min: number): string {
  const h = Math.floor(min / 60).toString().padStart(2, "0");
  const m = (min % 60).toString().padStart(2, "0");
  return `${h}:${m}`;
}

export async function GET() {
  const [aulas, materias, bloques] = await Promise.all([
    prisma.aula.findMany({
      include: {
        nivel: true,
        anioEscolar: true,
        matriculas: { where: { estado: "ACTIVA" } },
      },
      orderBy: [{ anioEscolar: { fechaInicio: "desc" } }, { nombre: "asc" }],
    }),
    prisma.materia.findMany({
      include: { nivel: true },
      orderBy: { nombre: "asc" },
    }),
    prisma.bloqueHorario.findMany({
      include: { aula: true, materia: true, docente: true, anioEscolar: true },
      orderBy: [{ anioEscolar: { fechaInicio: "desc" } }, { diaSemana: "asc" }, { horaInicioMin: "asc" }],
    }),
  ]);

  const wb = XLSX.utils.book_new();

  const aulasData = aulas.map((a) => ({
    Nombre: a.nombre,
    Nivel: a.nivel.nombre,
    Tanda: a.tanda,
    "Año escolar": a.anioEscolar.nombre,
    Cupo: a.capacidad,
    Matriculados: a.matriculas.length,
    Activa: a.activa ? "Sí" : "No",
  }));
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(aulasData), "Aulas");

  const materiasData = materias.map((m) => ({
    Nombre: m.nombre,
    Nivel: m.nivel?.nombre ?? "Todos los niveles",
    Descripción: m.descripcion ?? "",
    Activa: m.activa ? "Sí" : "No",
  }));
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(materiasData), "Materias");

  const horariosData = bloques.map((b) => ({
    "Año escolar": b.anioEscolar.nombre,
    Aula: b.aula.nombre,
    Materia: b.materia.nombre,
    Profesor: b.docente?.nombre ?? "",
    Día: DIA_LABEL[b.diaSemana] ?? b.diaSemana,
    "Hora inicio": minutosAHora(b.horaInicioMin),
    "Hora fin": minutosAHora(b.horaFinMin),
  }));
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(horariosData), "Horarios");

  const buffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });

  return new NextResponse(buffer, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="oferta-academica-${new Date()
        .toISOString()
        .slice(0, 10)}.xlsx"`,
    },
  });
}
