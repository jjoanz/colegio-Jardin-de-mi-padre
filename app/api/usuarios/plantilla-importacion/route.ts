import { NextResponse } from "next/server";
import * as XLSX from "xlsx";
import { requierePermiso } from "@/lib/permisos";

export const dynamic = "force-dynamic";

export async function GET() {
  await requierePermiso("usuarios", "crear");

  const filaEjemplo = {
    Cedula: "00100000002",
    Nombre: "Carlos Ramírez",
    Email: "carlos.ramirez@colegio.edu.do",
    RolNombre: "PROFESOR",
  };

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet([filaEjemplo]), "Maestros");
  const buffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });

  return new NextResponse(buffer, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": 'attachment; filename="plantilla-maestros.xlsx"',
    },
  });
}
