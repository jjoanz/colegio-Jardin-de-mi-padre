import { NextResponse } from "next/server";
import * as XLSX from "xlsx";
import { requierePermiso } from "@/lib/permisos";

export const dynamic = "force-dynamic";

export async function GET() {
  await requierePermiso("padres", "crear");

  const filaEjemplo = {
    Cedula: "00100000001",
    Nombre: "Juana",
    Apellido: "Pérez",
    Telefono: "809-555-0100",
    Email: "juana.perez@correo.com",
    ExpedienteEstudiante: "EST-2026-000001",
    Parentesco: "MADRE",
  };

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet([filaEjemplo]), "Padres");
  const buffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });

  return new NextResponse(buffer, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": 'attachment; filename="plantilla-padres.xlsx"',
    },
  });
}
